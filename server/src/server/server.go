package server

import (
    "fmt"
    "github.com/gorilla/websocket"
    "log"
    "net"
    "net/http"
    "regexp"
    "set"
)

type Player struct {
    Name    string `json:"name"`
    Score   int    `json:"score"`
    Address uint16 `json:"address"`
}

type Client struct {
    Conn   *websocket.Conn
    Player *Player
    Tokens []*set.Token
}

type Payload struct {
    Flag    bool         `json:"flag"`
    Tokens  []*set.Token `json:"tokens"`
    Message string       `json:"message"`
}

type Frame struct {
    Alive   bool         `json:"alive"`
    Players []*Player    `json:"players"`
    Tokens  []*set.Token `json:"tokens"`
    Set     []*set.Token `json:"set"`
}

type Response struct {
    Flag    bool   `json:"flag"`
    Frame   Frame  `json:"frame"`
    Message string `json:"message"`
}

var INSERT = make(chan Client)
var REMOVE = make(chan *websocket.Conn)
var INTERROGATE = make(chan Client)
var CHAT = make(chan string)

var CLIENTS = make(map[*websocket.Conn]*Player)

var TOKENS = set.Start(true)
var SET []*set.Token = nil

var LOOKUP = func() map[string]int {
    lookup := make(map[string]int)
    for i, id := range set.IDS {
        lookup[id] = i
    }
    return lookup
}()

var RE, _ = regexp.Compile("[^0-9a-zA-Z ]")

func address(conn *websocket.Conn) uint16 {
    return uint16(conn.RemoteAddr().(*net.TCPAddr).Port)
}

var upgrader = websocket.Upgrader{
    ReadBufferSize:  1024,
    WriteBufferSize: 1024,
    CheckOrigin:     func(r *http.Request) bool { return true },
}

func socket(w http.ResponseWriter, r *http.Request) {
    conn, err := upgrader.Upgrade(w, r, nil)
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
            CHAT <- fmt.Sprintf(
                "<em>%s</em>: %s",
                player.Name,
                RE.ReplaceAllString(payload.Message, ""),
            )
        }
    }
}

func broadcastFrame(alive bool) {
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
    broadcastFrame(false)
    set.ALL_TOKENS = set.AllTokens()
    SET = nil
}

func advance(tokens []*set.Token) {
    for _, token := range tokens {
        index := LOOKUP[token.Id]
        replacement, err := set.Pop()
        if err != nil {
            TOKENS[index] = nil
        } else {
            TOKENS[index] = replacement
            TOKENS[index].Id = token.Id
        }
    }
    for !set.AnySolution(TOKENS, true) {
        if len(set.ALL_TOKENS) < 1 {
            gameOver()
        } else {
            for _, token := range TOKENS {
                set.ALL_TOKENS = append(set.ALL_TOKENS, token)
            }
            if !set.AnySolution(set.ALL_TOKENS, true) {
                gameOver()
            }
        }
        set.Shuffle()
        TOKENS, _ = set.Init()
    }
}

func interrogate(tokens []*set.Token) bool {
    for i := range tokens {
        if *tokens[i] != *TOKENS[LOOKUP[tokens[i].Id]] {
            return false
        }
    }
    return true
}

func relay() {
    for {
        select {
        case client := <-INSERT:
            CLIENTS[client.Conn] = client.Player
            broadcastFrame(true)
        case conn := <-REMOVE:
            delete(CLIENTS, conn)
            broadcastFrame(true)
        case client := <-INTERROGATE:
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
            broadcastChat(message)
        }
    }
}

func Run(directory, host, port string) error {
    log.Printf("\n\tlistening on http://%s:%s/\n\n", host, port)
    http.HandleFunc("/ws", socket)
    http.Handle("/", http.FileServer(http.Dir(directory)))
    go relay()
    return http.ListenAndServe(fmt.Sprintf(":%s", port), nil)
}
