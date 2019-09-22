package main

import (
    "github.com/gorilla/websocket"
    "log"
    "net/http"
)

type message struct {
    Message string `json:"message"`
}

var upgrader = websocket.Upgrader{}

func socket(w http.ResponseWriter, r *http.Request) {
    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        return
    }
    for {
        m := message{}
        if err := conn.ReadJSON(&m); err != nil {
            log.Printf("%#v\n", err)
            return
        }
        log.Printf(
            "\n\taddress\t: %s\n\tmessage\t: %#v\n",
            conn.RemoteAddr(),
            m,
        )
        if err := conn.WriteJSON(m); err != nil {
            log.Printf("%#v\n", err)
            return
        }
    }
}

func main() {
    port := ":8080"
    log.Printf("listening on http://localhost%s/\n", port)
    http.HandleFunc("/ws", socket)
    http.Handle("/", http.FileServer(http.Dir("client")))
    if err := http.ListenAndServe(port, nil); err != nil {
        log.Fatal(err)
    }
}
