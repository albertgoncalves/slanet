package main

import (
    "log"
    "os"
    "path"

    "server"
)

func main() {
    err := server.Run(
        path.Join("..", "client", "src"),
        os.Getenv("HOST"),
        os.Getenv("PORT"),
    )
    if err != nil {
        log.Fatal(err)
    }
}
