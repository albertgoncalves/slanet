var FIGURE = document.getElementById("figure");
var LEDGER = document.getElementById("ledger");
var LOBBY = document.getElementById("lobby");
var NAME = document.getElementById("name");
var WEBSOCKET;

function randomColor() {
    var h = Math.floor(Math.random() * 360);
    var s = Math.floor(Math.random() * 25) + 75;
    var l = Math.floor(Math.random() * 25) + 50;
    var a = (Math.random() * 0.2) + 0.1;
    return "hsla(" + h.toString() + ", " + s.toString() + "%, " +
        l.toString() + "%, " + a.toString() + ")";
}

function inscribe(players) {
    var html = "<tr><th>" +
        "Handle" +
        "</th><th>" +
        "Score" +
        "</th><th>" +
        "Address" +
        "</th></tr>";
    players.sort(function(a, b) {
        return b.score - a.score;
    });
    var n = players.length;
    for (var i = 0; i < n; i++) {
        var player = players[i];
        html += "<tr style=\"background:" + randomColor() + ";\"><td>" +
            player.handle + "</td><td>" + player.score + "</td><td>" +
            player.address + "</td></tr>";
    }
    LEDGER.innerHTML = html;
}

function winner(players) {
    var score = 0;
    var player;
    var n = players.length;
    for (var i = 0; i < n; i++) {
        if (score < players[i].score) {
            score = players[i].score;
            player = players[i].handle;
        }
    }
    return player;
}

function client(handle) {
    WEBSOCKET = new WebSocket("ws://" + HOST + ":" + PORT + "/ws");
    WEBSOCKET.onopen = function() {
        console.log("connected");
        var payload = {handle: handle};
        WEBSOCKET.send(JSON.stringify(payload));
        drawFrames(function(maneuver) {
            WEBSOCKET.send(JSON.stringify(maneuver));
        });
    };
    WEBSOCKET.onclose = function() {
        console.log("disconnected");
    };
    WEBSOCKET.onmessage = function(payload) {
        var response = JSON.parse(payload.data);
        console.log(response);
        if (response.message === "alive") {
            inscribe(response.players);
            drawTokens(response.tokens);
        } else {
            WEBSOCKET.close();
            FIGURE.parentNode.removeChild(FIGURE);
            LEDGER.parentNode.removeChild(LEDGER);
            if (0 < response.players.length) {
                document.body.innerHTML +=
                    "<div id=\"lobby\"><p id=\"text\">the winner is <strong>" +
                    winner(response.players) + "</strong></p></div>";
            }
        }
    };
    WEBSOCKET.onerror = function(err) {
        console.log(err);
    };
}

window.addEventListener("load", function() {
    NAME.onkeypress = function(event) {
        if (event.keyCode === 13) {
            var handle = NAME.value;
            if (handle != "") {
                LOBBY.parentNode.removeChild(LOBBY);
                client(handle);
                NAME.onkeypress = null;
            }
        }
    };
}, false);
