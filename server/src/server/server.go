package server

import (
    "combo"
    "encoding/json"
    "github.com/gorilla/websocket"
    "log"
    "net"
    "net/http"
)

type status struct {
    Handle  string `json:"handle"`
    Score   uint8  `json:"score"`
    Address uint16 `json:"address"`
}

type client struct {
    Conn   *websocket.Conn
    Status *status
}

type ledger struct {
    Players []*status      `json:"players"`
    Tokens  []*combo.Token `json:"tokens"`
}

var MEMO = make(chan client)
var REMOVE = make(chan *websocket.Conn)
var CLIENTS = make(map[*websocket.Conn]*status)
var DEPLETE = make(chan []*combo.Token)

var TOKENS = func() []*combo.Token {
    combo.ShuffleTokens()
    tokens, _ := combo.Init()
    for {
        if combo.AnySolution(tokens) {
            return tokens
        }
        combo.ALL_TOKENS = combo.AllTokens()
        combo.ShuffleTokens()
        tokens, _ = combo.Init()
    }
}()

const BOLD = "\033[1m"
const END = "\033[0m"

func address(conn *websocket.Conn) uint16 {
    return uint16(conn.RemoteAddr().(*net.TCPAddr).Port)
}

var upgrader = websocket.Upgrader{
    ReadBufferSize:  1024,
    WriteBufferSize: 1024,
    CheckOrigin:     func(r *http.Request) bool { return true },
}

func logError(parent, child string, err error) {
    log.Printf(
        "\n\t%s%#v%s\n\t@ { %s { %s } }\n\n",
        BOLD,
        err,
        END,
        parent,
        child,
    )
}

func pretty(i interface{}) string {
    s, _ := json.MarshalIndent(i, "", "\t")
    return string(s)
}

func socket(w http.ResponseWriter, r *http.Request) {
    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        logError("socket(...)", "upgrader.Upgrade(w, r, nil)", err)
        return
    }
    defer conn.Close()
    s := &status{Score: 0, Address: address(conn)}
    if err := conn.ReadJSON(s); err != nil {
        logError("socket(...)", "conn.ReadJSON(s)", err)
        return
    }
    MEMO <- client{Conn: conn, Status: s}
    for {
        tokens := &[]*combo.Token{}
        if err := conn.ReadJSON(tokens); err != nil {
            REMOVE <- conn
            logError("socket(...)", "conn.ReadJSON(u)", err)
            return
        }
        if combo.Validate(*tokens) {
            s.Score++
            MEMO <- client{Conn: conn, Status: s}
            DEPLETE <- *tokens
        }
    }
}

func broadcast() {
    for {
        select {
        case client := <-MEMO:
            CLIENTS[client.Conn] = client.Status
        case conn := <-REMOVE:
            delete(CLIENTS, conn)
        case tokens := <-DEPLETE:
            for _, token := range tokens {
                replacement, err := combo.Pop()
                if err != nil {
                    break
                }
                index, err := combo.Lookup(token.Id)
                if err != nil {
                    break
                }
                TOKENS[index] = replacement
                TOKENS[index].Id = token.Id
            }
        }
        var players = make([]*status, len(CLIENTS))
        i := 0
        for _, p := range CLIENTS {
            players[i] = p
            i++
        }
        payload := ledger{
            Players: players,
            Tokens:  TOKENS,
        }
        for conn := range CLIENTS {
            if err := conn.WriteJSON(payload); err != nil {
                logError("broadcast()", "conn.WriteJSON(players)", err)
            }
        }
    }
}

func Run(directory, port string) error {
    log.Printf("\n\tlistening on http://localhost%s/\n\n", port)
    http.HandleFunc("/ws", socket)
    http.Handle("/", http.FileServer(http.Dir(directory)))
    go broadcast()
    return http.ListenAndServe(port, nil)
}
