package server

import (
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

type update struct {
    Content string `json:"content"`
}

type client struct {
    Conn   *websocket.Conn
    Status *status
}

var ADD = make(chan client)
var REMOVE = make(chan *websocket.Conn)
var CLIENTS = make(map[*websocket.Conn]*status)

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
        log.Printf("%#v\n", err)
        return
    }
    defer conn.Close()
    s := &status{Score: 0, Address: address(conn)}
    if err := conn.ReadJSON(s); err != nil {
        log.Printf("%#v\n", err)
        return
    }
    ADD <- client{Conn: conn, Status: s}
    for {
        u := &update{}
        if err := conn.ReadJSON(u); err != nil {
            REMOVE <- conn
            log.Printf("%#v\n", err)
            return
        }
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
                log.Printf("%#v\n", err)
            }
        }
    }
}

func Run(directory, port string) error {
    log.Printf("listening on http://localhost%s/\n", port)
    http.HandleFunc("/ws", socket)
    http.Handle("/", http.FileServer(http.Dir(directory)))
    go broadcast()
    return http.ListenAndServe(port, nil)
}
