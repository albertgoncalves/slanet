package server

import (
    "set"
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
    Tokens  []*set.Token `json:"tokens"`
}

var MEMO = make(chan client)
var REMOVE = make(chan *websocket.Conn)
var CLIENTS = make(map[*websocket.Conn]*status)
var DEPLETE = make(chan []*set.Token)

var TOKENS = func() []*set.Token {
    set.ShuffleTokens()
    set.ALL_TOKENS = set.ALL_TOKENS
    tokens, _ := set.Init()
    for {
        if set.AnySolution(tokens) {
            return tokens
        }
        set.ALL_TOKENS = set.AllTokens()
        set.ShuffleTokens()
        tokens, _ = set.Init()
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
        tokens := &[]*set.Token{}
        if err := conn.ReadJSON(tokens); err != nil {
            REMOVE <- conn
            logError("socket(...)", "conn.ReadJSON(u)", err)
            return
        }
        if set.Validate(*tokens) {
            s.Score++
            MEMO <- client{Conn: conn, Status: s}
            DEPLETE <- *tokens
        }
    }
}

func relay() {
    for {
        select {
        case client := <-MEMO:
            CLIENTS[client.Conn] = client.Status
        case conn := <-REMOVE:
            delete(CLIENTS, conn)
        case tokens := <-DEPLETE:
            for _, token := range tokens {
                index, err := set.Lookup(token.Id)
                if err != nil {
                    break
                }
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
                    set.ALL_TOKENS = set.AllTokens()
                    set.ShuffleTokens()
                } else {
                    for _, token := range TOKENS {
                        set.ALL_TOKENS = append(set.ALL_TOKENS, token)
                    }
                }
                TOKENS, _ = set.Init()
            }
        }
        log.Println(len(TOKENS))
        log.Println(len(set.ALL_TOKENS))
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
                logError("relay()", "conn.WriteJSON(players)", err)
            }
        }
    }
}

func Run(directory, port string) error {
    log.Printf("\n\tlistening on http://localhost%s/\n\n", port)
    http.HandleFunc("/ws", socket)
    http.Handle("/", http.FileServer(http.Dir(directory)))
    go relay()
    return http.ListenAndServe(port, nil)
}
