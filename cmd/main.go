package main

import (
    "log"
    "net/http"
    "server"
)

func main() {
    port := ":8080"
    log.Printf("listening on http://localhost%s/\n", port)
    http.HandleFunc("/ws", server.Socket)
    http.Handle("/", http.FileServer(http.Dir("client")))
    if err := http.ListenAndServe(port, nil); err != nil {
        log.Fatal(err)
    }
}
