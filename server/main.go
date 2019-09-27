package main

import (
    "log"
    "os"
    "server"
)

func main() {
    err := server.Run("../client/src", os.Getenv("HOST"), os.Getenv("PORT"))
    if err != nil {
        log.Fatal(err)
    }
}
