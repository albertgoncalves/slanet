# slanet

Barebones [LAN](https://en.wikipedia.org/wiki/Local_area_network) implementation of [Set](https://en.wikipedia.org/wiki/Set_(card_game)) for the browser.

![](cover.png)

Needed things
---
*   [Nix](https://nixos.org/nix/)
*   Bash

Server start
---
```
$ nix-shell
[nix-shell:path/to/slanet]$ ./main
```

Dev
---
```
[nix-shell:path/to/slanet/server]$ go test set
```
```
[nix-shell:path/to/slanet/]$ ./lint
```
