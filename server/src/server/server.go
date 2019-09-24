package server

import (
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

type maneuver struct {
    Id        string `json:"id"`
    Shape     string `json:"shape"`
    Fill      string `json:"fill"`
    Color     string `json:"color"`
    Frequency uint8  `json:"frequency"`
}

type client struct {
    Conn   *websocket.Conn
    Status *status
}

var ADD = make(chan client)
var REMOVE = make(chan *websocket.Conn)
var CLIENTS = make(map[*websocket.Conn]*status)

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
    ADD <- client{Conn: conn, Status: s}
    for {
        m := &[]maneuver{}
        if err := conn.ReadJSON(m); err != nil {
            REMOVE <- conn
            logError("socket(...)", "conn.ReadJSON(u)", err)
            return
        }
        log.Printf("%s\n", pretty(m))
    }
}

func broadcast() {
    for {
        select {
        case client := <-ADD:
            CLIENTS[client.Conn] = client.Status
        case conn := <-REMOVE:
            delete(CLIENTS, conn)
        }
        var players = make([]*status, len(CLIENTS))
        i := 0
        for _, p := range CLIENTS {
            players[i] = p
            i++
        }
        for conn := range CLIENTS {
            if err := conn.WriteJSON(players); err != nil {
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
