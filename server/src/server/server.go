package server

import (
    "fmt"
    "hash/fnv"
    "log"
    "math/rand"
    "net"
    "net/http"
    "regexp"
    "strings"

    "github.com/gorilla/websocket"

    "set"
)

type Player struct {
    Name    string
    Score   int
    Address uint16
    Color   string
}

type Client struct {
    Conn   *websocket.Conn
    Player *Player
    Tokens []*set.Token
}

type Payload struct {
    Flag    bool
    Tokens  []*set.Token
    Message string
}

type Frame struct {
    Alive   bool
    Players []*Player
    Tokens  []*set.Token
    Set     []*set.Token
}

type Response struct {
    Flag    bool
    Frame   Frame
    Message string
}

var (
    INSERT      = make(chan Client)
    REMOVE      = make(chan *websocket.Conn)
    INTERROGATE = make(chan Client)
    CHAT        = make(chan string)
)

var (
    TOKENS []*set.Token = set.Start()
    SET    []*set.Token = nil
)

var (
    CLIENTS = make(map[*websocket.Conn]*Player)
    LOOKUP  = func() map[string]int {
        lookup := make(map[string]int)
        for i, id := range set.IDS {
            lookup[id] = i
        }
        return lookup
    }()
)

var (
    UPGRADER = websocket.Upgrader{
        ReadBufferSize:  1024,
        WriteBufferSize: 1024,
        CheckOrigin:     func(r *http.Request) bool { return true },
    }
    RE, _ = regexp.Compile("[^0-9a-zA-Z.,?! ]")
    SPAN  = `<span style=` +
        `"color: white; background-color: %s; opacity: 0.75;"` +
        `> %s </span> %s`
)

func address(conn *websocket.Conn) uint16 {
    return uint16(conn.RemoteAddr().(*net.TCPAddr).Port)
}

func hash(s string) uint32 {
    h := fnv.New32a()
    h.Write([]byte(s))
    return h.Sum32()
}

func sanitize(input string) string {
    return strings.TrimSpace(RE.ReplaceAllString(input, ""))
}

func socket(w http.ResponseWriter, r *http.Request) {
    conn, err := UPGRADER.Upgrade(w, r, nil)
    if err != nil {
        log.Println(err)
        return
    }
    defer conn.Close()
    player := &Player{Score: 0, Address: address(conn)}
    if err := conn.ReadJSON(player); err != nil {
        log.Println(err)
        return
    }
    player.Color = fmt.Sprintf(
        "hsl(%d, %d%%, %d%%)",
        hash(player.Name)%360,
        rand.Intn(30)+40,
        rand.Intn(35)+25,
    )
    player.Name = sanitize(player.Name)
    client := Client{Conn: conn, Player: player}
    INSERT <- client
    for {
        payload := &Payload{}
        if err := conn.ReadJSON(payload); err != nil {
            REMOVE <- conn
            log.Println(err)
            return
        }
        if payload.Flag {
            client.Tokens = payload.Tokens
            INTERROGATE <- client
        } else {
            message := sanitize(payload.Message)
            if message != "" {
                CHAT <- fmt.Sprintf(SPAN, player.Color, player.Name, message)
            }
        }
    }
}

func broadcastFrame(alive bool) {
    log.Printf("broadcastFrame(%t)\n", alive)
    var players = make([]*Player, len(CLIENTS))
    i := 0
    for _, player := range CLIENTS {
        players[i] = player
        i++
    }
    for conn := range CLIENTS {
        if err := conn.WriteJSON(Response{
            Flag: true,
            Frame: Frame{
                Alive:   alive,
                Players: players,
                Tokens:  TOKENS,
                Set:     SET,
            },
        }); err != nil {
            log.Println(err)
        }
    }
}

func broadcastChat(message string) {
    log.Printf("broadcastChat(%s)\n", message)
    for conn := range CLIENTS {
        if err := conn.WriteJSON(Response{
            Flag:    false,
            Message: message,
        }); err != nil {
            log.Println(err)
        }
    }
}

func gameOver() {
    log.Println("gameOver()")
    broadcastFrame(false)
    set.ALL_TOKENS = set.AllTokens()
    SET = nil
}

func advance(tokens []*set.Token) {
    log.Printf("advance(%+v)\n", tokens)
    for _, token := range tokens {
        index := LOOKUP[token.Id]
        if replacement, err := set.Pop(); err != nil {
            TOKENS[index] = nil
        } else {
            TOKENS[index] = replacement
            TOKENS[index].Id = token.Id
        }
    }
    for !set.AnySolution(TOKENS) {
        if len(set.ALL_TOKENS) < 1 {
            gameOver()
        } else {
            for _, token := range TOKENS {
                set.ALL_TOKENS = append(set.ALL_TOKENS, token)
            }
            if !set.AnySolution(set.ALL_TOKENS) {
                gameOver()
            }
        }
        set.Shuffle()
        TOKENS, _ = set.Init()
    }
}

func interrogate(tokens []*set.Token) bool {
    log.Printf("interrogate(%+v)\n", tokens)
    for i := range tokens {
        if (tokens[i] == nil) || (TOKENS[LOOKUP[tokens[i].Id]] == nil) ||
            (*tokens[i] != *TOKENS[LOOKUP[tokens[i].Id]]) {
            return false
        }
    }
    return true
}

func relay() {
    for {
        select {
        case client := <-INSERT:
            log.Println("relay(<-INSERT)")
            CLIENTS[client.Conn] = client.Player
            broadcastFrame(true)
        case conn := <-REMOVE:
            log.Println("relay(<-REMOVE)")
            delete(CLIENTS, conn)
            broadcastFrame(true)
        case client := <-INTERROGATE:
            log.Println("relay(<-INTERROGATE)")
            if interrogate(client.Tokens) {
                if set.Validate(client.Tokens) {
                    client.Player.Score++
                    SET = client.Tokens
                    advance(client.Tokens)
                } else {
                    client.Player.Score--
                }
                CLIENTS[client.Conn] = client.Player
            }
            broadcastFrame(true)
        case message := <-CHAT:
            log.Println("relay(<-CHAT)")
            broadcastChat(message)
        }
    }
}

func Run(directory, host, port string) error {
    log.Printf("listening on http://%s:%s/\n", host, port)
    http.HandleFunc("/ws", socket)
    http.Handle("/", http.FileServer(http.Dir(directory)))
    go relay()
    return http.ListenAndServe(fmt.Sprintf(":%s", port), nil)
}
