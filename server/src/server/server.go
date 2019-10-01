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
    Name    string `json:"name"`
    Score   int    `json:"score"`
    Address uint16 `json:"address"`
}

type Client struct {
    Conn   *websocket.Conn
    Player *Player
}

type Frame struct {
    Alive   bool         `json:"alive"`
    Players []*Player    `json:"players"`
    Tokens  []*set.Token `json:"tokens"`
}

var MEMO = make(chan Client)
var REMOVE = make(chan *websocket.Conn)
var INTERROGATE = make(chan []*set.Token)
var APPROVE = make(chan bool)
var ADVANCE = make(chan []*set.Token)

var CLIENTS = make(map[*websocket.Conn]*Player)

var TOKENS = set.Start(true)

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
    lookup["3,0"] = 9
    lookup["3,1"] = 10
    lookup["3,2"] = 11
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
        client := Client{Conn: conn, Player: player}
        INTERROGATE <- *tokens
        if <-APPROVE {
            player.Score++
            MEMO <- client
            ADVANCE <- *tokens
        } else {
            player.Score--
            MEMO <- client
        }
    }
}

func broadcast(alive bool) {
    var players = make([]*Player, len(CLIENTS))
    i := 0
    for _, player := range CLIENTS {
        players[i] = player
        i++
    }
    for conn := range CLIENTS {
        if err := conn.WriteJSON(Frame{
            Alive:   alive,
            Players: players,
            Tokens:  TOKENS,
        }); err != nil {
            log.Println(err)
        }
    }
}

func gameOver() {
    broadcast(false)
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
        case client := <-MEMO:
            CLIENTS[client.Conn] = client.Player
            broadcast(true)
        case conn := <-REMOVE:
            delete(CLIENTS, conn)
            broadcast(true)
        case tokens := <-INTERROGATE:
            APPROVE <- interrogate(tokens) && set.Validate(tokens)
        case tokens := <-ADVANCE:
            advance(tokens)
            broadcast(true)
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
