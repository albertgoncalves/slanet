package main

import (
    "log"
    "server"
)

func main() {
    if err := server.Run("../client/src", ":8080"); err != nil {
        log.Fatal(err)
    }
}
