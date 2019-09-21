package main

import (
    "fmt"
    "log"
    "net/http"
)

func serveClient(port uint16) {
    fmt.Printf("Listening on http://localhost:%d/\n", port)
    fs := http.FileServer(http.Dir("client"))
    http.Handle("/", fs)
    if err := http.ListenAndServe(fmt.Sprintf(":%d", port), nil); err != nil {
        log.Fatal(err)
    }
}

func main() {
    go serveClient(8080)
    select {}
}
