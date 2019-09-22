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

type clientMemo struct {
    Client *websocket.Conn
    Player *player
}

type clientBroadcast struct {
    Client  *websocket.Conn
    Players *map[string]uint8
}

var clients = make(map[*websocket.Conn]*player)
var upgrader = websocket.Upgrader{}
var add = make(chan clientMemo)
var remove = make(chan *websocket.Conn)
var inform = make(chan clientBroadcast)

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
    add <- clientMemo{Client: conn, Player: p}
    for {
        u := &update{}
        if err := conn.ReadJSON(u); err != nil {
            remove <- conn
            log.Printf("%#v\n", err)
            return
        }
    }
}

func broadcast() {
    var currentPlayers = make(map[string]uint8)
    for _, p := range clients {
        currentPlayers[p.Handle] = p.Score
    }
    log.Println(currentPlayers)
    for conn := range clients {
        inform <- clientBroadcast{Client: conn, Players: &currentPlayers}
    }
}

func Memo() {
    for {
        select {
        case payload := <-add:
            clients[payload.Client] = payload.Player
        case payload := <-remove:
            delete(clients, payload)
        }
        broadcast()
    }
}

func Relay() {
    for {
        select {
        case payload := <-inform:
            if err := payload.Client.WriteJSON(payload.Players); err != nil {
                log.Printf("%#v\n", err)
            }
        }
    }
}
