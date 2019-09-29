var FIGURE = document.getElementById("figure");
var BASE = document.getElementById("base");
var LEDGER = document.getElementById("ledger");
var LOBBY = document.getElementById("lobby");
var NAME = document.getElementById("name");
var WEBSOCKET;

function randomColor() {
    var h = Math.floor(Math.random() * 360) % 360;
    var s = Math.floor(Math.random() * 25) + 75;
    var l = Math.floor(Math.random() * 25) + 50;
    var a = (Math.random() * 0.2) + 0.1;
    return "hsla(" + h.toString() + ", " + s.toString() + "%, " +
        l.toString() + "%, " + a.toString() + ")";
}

function inscribe(players) {
    var html = "<tr><th>" +
        "Name" +
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
            player.name + "</td><td>" + player.score + "</td></tr>";
    }
    LEDGER.innerHTML = html;
}

function winner(players) {
    var score = players[0].score;
    var winners = [players[0].name];
    var n = players.length;
    for (var i = 1; i < n; i++) {
        if (score === players[i].score) {
            winners.push(players[i].name);
        } else if (score < players[i].score) {
            score = players[i].score;
            winners = [players[i].name];
        }
    }
    return winners;
}

function client(name) {
    WEBSOCKET = new WebSocket("ws://" + HOST + ":" + PORT + "/ws");
    WEBSOCKET.onopen = function() {
        var payload = {name: name};
        WEBSOCKET.send(JSON.stringify(payload));
        drawFrames(function(selection) {
            WEBSOCKET.send(JSON.stringify(selection));
        });
    };
    WEBSOCKET.onclose = function() {};
    WEBSOCKET.onmessage = function(payload) {
        var response = JSON.parse(payload.data);
        if (response.alive) {
            inscribe(response.players);
            drawTokens(response.tokens);
        } else {
            WEBSOCKET.close();
            document.body.removeChild(FIGURE);
            document.body.removeChild(BASE);
            if (0 < response.players.length) {
                winners = winner(response.players);
                var epilogue;
                if (1 < winners.length) {
                    epilogue = "the winners are ";
                } else {
                    epilogue = "the winner is ";
                }
                document.body.innerHTML +=
                    "<div id=\"lobby\"><p id=\"text\">" + epilogue +
                    "<strong>" + winners.join("</strong> & <strong>") +
                    "</strong>, refresh page to play again</p></div>";
            }
        }
    };
    WEBSOCKET.onerror = function(error) {
        console.log(error);
    };
}

window.addEventListener("load", function() {
    NAME.onkeypress = function(event) {
        if (event.keyCode === 13) {
            var name = NAME.value;
            if (name != "") {
                document.body.removeChild(LOBBY);
                client(name);
                NAME.onkeypress = null;
            }
            var slider = document.createElement("div");
            slider.className = "center";
            slider.innerHTML +=
                "<input type=\"range\" min=\"0\" max=\"359\" value=\"" +
                RED.toString() + "\" id=\"slider\">";
            slider.oninput = function() {
                TOKEN_COLOR = assignColors(
                    parseInt(document.getElementById("slider").value), 10);
                paintTokens();
            };
            LEDGER.parentNode.insertBefore(slider, LEDGER);
        }
    };
}, false);
