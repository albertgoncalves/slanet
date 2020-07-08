package main

import (
    "log"
    "os"
    "path"

    "server"
)

func main() {
    if err := server.Run(
        path.Join("..", "client", "src"),
        os.Getenv("HOST"),
        os.Getenv("PORT"),
    ); err != nil {
        log.Fatal(err)
    }
}
