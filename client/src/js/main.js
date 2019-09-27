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
        "</th></tr>";
    players.sort(function(a, b) {
        return b.score - a.score;
    });
    var n = players.length;
    for (var i = 0; i < n; i++) {
        var player = players[i];
        html += "<tr style=\"background:" + randomColor() + ";\"><td>" +
            player.handle + "</td><td>" + player.score + "</td></tr>";
    }
    LEDGER.innerHTML = html;
}

function winner(players) {
    var score = players[0].score;
    var winners = [players[0].handle];
    var n = players.length;
    for (var i = 1; i < n; i++) {
        if (score === players[i].score) {
            winners.push(players[i].handle);
        } else if (score < players[i].score) {
            score = players[i].score;
            winners = [players[i].handle];
        }
    }
    return winners;
}

function client(handle) {
    WEBSOCKET = new WebSocket("ws://" + HOST + ":" + PORT + "/ws");
    WEBSOCKET.onopen = function() {
        console.log("alive");
        var payload = {handle: handle};
        WEBSOCKET.send(JSON.stringify(payload));
        drawFrames(function(maneuver) {
            WEBSOCKET.send(JSON.stringify(maneuver));
        });
    };
    WEBSOCKET.onclose = function() {
        console.log("dead");
    };
    WEBSOCKET.onmessage = function(payload) {
        var response = JSON.parse(payload.data);
        if (response.code === 1) {
            inscribe(response.players);
            drawTokens(response.tokens);
        } else {
            WEBSOCKET.close();
            FIGURE.parentNode.removeChild(FIGURE);
            LEDGER.parentNode.removeChild(LEDGER);
            if (0 < response.players.length) {
                winners = winner(response.players);
                var epilogue;
                if (1 < winners.length) {
                    epilogue = "the winners are <strong>";
                } else {
                    epilogue = "the winner is <strong>";
                }
                document.body.innerHTML +=
                    "<div id=\"lobby\"><p id=\"text\">" + epilogue +
                    winners.join("</strong> & <strong>") +
                    "</strong>, refresh page to play again</p></div>";
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
