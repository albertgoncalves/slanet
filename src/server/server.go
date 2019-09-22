package server

import (
    "github.com/gorilla/websocket"
    "log"
    "net/http"
)

type player struct {
    Handle string `json:"handle"`
    Score  uint8
}

type update struct {
    Content string `json:"content"`
}

var clients = make(map[*websocket.Conn]*player)
var upgrader = websocket.Upgrader{}

func broadcast() {
    var currentPlayers = make(map[string]uint8)
    for _, p := range clients {
        currentPlayers[p.Handle] = p.Score
    }
    log.Println(currentPlayers)
    for client := range clients {
        if err := client.WriteJSON(currentPlayers); err != nil {
            log.Printf("%#v\n", err)
        }
    }
}

func Socket(w http.ResponseWriter, r *http.Request) {
    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        log.Printf("%#v\n", err)
        return
    }
    p := &player{Score: 0}
    if err := conn.ReadJSON(p); err != nil {
        log.Printf("%#v\n", err)
        return
    }
    clients[conn] = p
    broadcast()
    for {
        u := &update{}
        if err := conn.ReadJSON(u); err != nil {
            delete(clients, conn)
            broadcast()
            log.Printf("%#v\n", err)
            return
        }
    }
}
