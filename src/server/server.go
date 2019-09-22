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

var upgrader = websocket.Upgrader{}
var add = make(chan client)
var remove = make(chan *websocket.Conn)
var clients = make(map[*websocket.Conn]*status)

func address(conn *websocket.Conn) uint16 {
    return uint16(conn.RemoteAddr().(*net.TCPAddr).Port)
}

func Socket(w http.ResponseWriter, r *http.Request) {
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
    add <- client{Conn: conn, Status: s}
    for {
        u := &update{}
        if err := conn.ReadJSON(u); err != nil {
            remove <- conn
            log.Printf("%#v\n", err)
            return
        }
    }
}

func Broadcast() {
    for {
        select {
        case client := <-add:
            clients[client.Conn] = client.Status
        case conn := <-remove:
            delete(clients, conn)
        }
        var players = make([]*status, len(clients))
        i := 0
        for _, p := range clients {
            players[i] = p
            i++
        }
        for conn := range clients {
            if err := conn.WriteJSON(players); err != nil {
                log.Printf("%#v\n", err)
            }
        }
    }
}
