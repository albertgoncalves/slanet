package server

import (
    "fmt"
    "github.com/gorilla/websocket"
    "log"
    "net"
    "net/http"
    "set"
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
    Players []*status    `json:"players"`
    Tokens  []*set.Token `json:"tokens"`
}

var MEMO = make(chan client)
var REMOVE = make(chan *websocket.Conn)
var CLIENTS = make(map[*websocket.Conn]*status)
var ADVANCE = make(chan []*set.Token)

var TOKENS = func() []*set.Token {
    set.Shuffle()
    tokens, err := set.Init()
    if err != nil {
        log.Fatal(err)
    }
    for {
        if set.AnySolution(tokens) {
            return tokens
        }
        set.ALL_TOKENS = set.AllTokens()
        set.Shuffle()
        tokens, _ = set.Init()
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

func fmtError(parent, child string, err error) string {
    return fmt.Sprintf(
        "\n\t%s%#v%s\n\t@ { %s { %s } }\n\n",
        BOLD,
        err,
        END,
        parent,
        child,
    )
}

func socket(w http.ResponseWriter, r *http.Request) {
    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        log.Print(fmtError("socket(...)", "upgrader.Upgrade(w, r, nil)", err))
        return
    }
    defer conn.Close()
    s := &status{Score: 0, Address: address(conn)}
    if err := conn.ReadJSON(s); err != nil {
        log.Print(fmtError("socket(...)", "conn.ReadJSON(s)", err))
        return
    }
    MEMO <- client{Conn: conn, Status: s}
    for {
        tokens := &[]*set.Token{}
        if err := conn.ReadJSON(tokens); err != nil {
            REMOVE <- conn
            log.Print(fmtError("socket(...)", "conn.ReadJSON(u)", err))
            return
        }
        if set.Validate(*tokens) {
            s.Score++
            MEMO <- client{Conn: conn, Status: s}
            ADVANCE <- *tokens
        }
    }
}

func restart() {
    set.ALL_TOKENS = set.AllTokens()
}

func relay() {
    for {
        select {
        case client := <-MEMO:
            CLIENTS[client.Conn] = client.Status
        case conn := <-REMOVE:
            delete(CLIENTS, conn)
        case tokens := <-ADVANCE:
            for _, token := range tokens {
                index, ok := LOOKUP[token.Id]
                if !ok {
                    log.Fatal(fmtError(
                        "relay",
                        "<-ADVANCE",
                        fmt.Errorf("LOOKUP[%s]", token.Id),
                    ))
                }
                replacement, err := set.Pop()
                if err != nil {
                    TOKENS[index] = nil
                } else {
                    TOKENS[index] = replacement
                    TOKENS[index].Id = token.Id
                }
            }
            log.Println("Searching TOKENS")
            for !set.AnySolution(TOKENS) {
                log.Println("No solutions found in TOKENS")
                if len(set.ALL_TOKENS) < 1 {
                    log.Println("len(set.ALL_TOKENS) < 1")
                    restart()
                } else {
                    for _, token := range TOKENS {
                        if token == nil {
                            log.Fatal(fmtError(
                                "relay",
                                "<-ADVANCE",
                                fmt.Errorf("token == nil"),
                            ))
                        }
                        set.ALL_TOKENS = append(set.ALL_TOKENS, token)
                    }
                    log.Printf(
                        "Searching ALL_TOKENS, len(ALL_TOKENS) = %d\n",
                        len(set.ALL_TOKENS),
                    )
                    if !set.AnySolution(set.ALL_TOKENS) {
                        log.Println("No solutions found in ALL_TOKENS")
                        restart()
                    }
                }
                set.Shuffle()
                var err error
                TOKENS, err = set.Init()
                if err != nil {
                    log.Fatal(fmtError("relay", "<-ADVANCE", err))
                }
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
                log.Print(fmtError("relay()", "conn.WriteJSON(players)", err))
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
