package server

import (
    "fmt"
    "github.com/gorilla/websocket"
    "log"
    "net"
    "net/http"
    "set"
)

type Player struct {
    Handle  string `json:"handle"`
    Score   uint8  `json:"score"`
    Address uint16 `json:"address"`
}

type Client struct {
    Conn   *websocket.Conn
    Player *Player
}

type Frame struct {
    Message string       `json:"message"`
    Players []*Player    `json:"players"`
    Tokens  []*set.Token `json:"tokens"`
}

var MEMO = make(chan Client)
var REMOVE = make(chan *websocket.Conn)
var CLIENTS = make(map[*websocket.Conn]*Player)
var ADVANCE = make(chan []*set.Token)

var TOKENS = func() []*set.Token {
    for {
        set.Shuffle()
        tokens, err := set.Init()
        if err != nil {
            set.ALL_TOKENS = set.AllTokens()
        } else if set.AnySolution(tokens) {
            return tokens
        }
    }
}()

var LOOKUP = func() map[string]int {
    lookup := make(map[string]int)
    lookup["0,0"] = 0
    lookup["0,1"] = 1
    lookup["0,2"] = 2
    lookup["1,0"] = 3
    lookup["1,1"] = 4
    lookup["1,2"] = 5
    lookup["2,0"] = 6
    lookup["2,1"] = 7
    lookup["2,2"] = 8
    return lookup
}()

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
    MEMO <- Client{Conn: conn, Player: player}
    for {
        tokens := &[]*set.Token{}
        if err := conn.ReadJSON(tokens); err != nil {
            REMOVE <- conn
            log.Println(err)
            return
        }
        if set.Validate(*tokens) {
            player.Score++
            MEMO <- Client{Conn: conn, Player: player}
            ADVANCE <- *tokens
        }
    }
}

func broadcast(message string) {
    var players = make([]*Player, len(CLIENTS))
    i := 0
    for _, player := range CLIENTS {
        players[i] = player
        i++
    }
    for conn := range CLIENTS {
        if err := conn.WriteJSON(Frame{
            Message: message,
            Players: players,
            Tokens:  TOKENS,
        }); err != nil {
            log.Println(err)
        }
    }
}

func gameOver() {
    broadcast("dead")
    set.ALL_TOKENS = set.AllTokens()
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

func relay() {
    for {
        select {
        case client := <-MEMO:
            CLIENTS[client.Conn] = client.Player
        case conn := <-REMOVE:
            delete(CLIENTS, conn)
        case tokens := <-ADVANCE:
            advance(tokens)
        }
        broadcast("alive")
    }
}

func Run(directory, host, port string) error {
    log.Printf("\n\tlistening on http://%s:%s/\n\n", host, port)
    http.HandleFunc("/ws", socket)
    http.Handle("/", http.FileServer(http.Dir(directory)))
    go relay()
    return http.ListenAndServe(fmt.Sprintf(":%s", port), nil)
}
