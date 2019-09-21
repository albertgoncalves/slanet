package main

import (
    "github.com/gorilla/websocket"
    "log"
    "net/http"
)

var upgrader = websocket.Upgrader{}

func echo(w http.ResponseWriter, r *http.Request) {
    con, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        return
    }
    for {
        messageType, message, err := con.ReadMessage()
        if err != nil {
            return
        }
        log.Printf("%s sent: %s\n", con.RemoteAddr(), string(message))
        if err := con.WriteMessage(messageType, message); err != nil {
            return
        }
    }
}

func main() {
    port := ":8080"
    log.Printf("listening on http://localhost%s/\n", port)
    http.HandleFunc("/echo", echo)
    http.Handle("/", http.FileServer(http.Dir("client")))
    if err := http.ListenAndServe(port, nil); err != nil {
        log.Fatal(err)
    }
}
