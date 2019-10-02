"use strict";

/*  global assignColors, drawFrames, drawTokens, HOST, paintTokens, PORT,
        randomHue, RED, TOKEN_COLOR:true */

var FIGURE = document.getElementById("figure");
var BASE = document.getElementById("base");
var LEDGER = document.getElementById("ledger");
var LOBBY = document.getElementById("lobby");
var NAME = document.getElementById("name");
var SLIDER;
var WEBSOCKET;

function randomColor() {
    return "hsla(" + randomHue().toString() + ", " +
        (Math.floor(Math.random() * 25) + 75).toString() + "%, " +
        (Math.floor(Math.random() * 25) + 50).toString() + "%, " +
        ((Math.random() * 0.2) + 0.1).toString() + ")";
}

function inscribe(players) {
    var html = "<tr><th>Name</th><th>Score</th></tr>";
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
                var winners = winner(response.players);
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

function setColor(element, hue) {
    element.style.setProperty("--Color", "hsl(" + hue + ", 50%, 75%)");
}

window.addEventListener("load", function() {
    NAME.onkeypress = function(event) {
        if (event.keyCode === 13) {
            var name = NAME.value;
            var red = RED.toString();
            if (name != "") {
                document.body.removeChild(LOBBY);
                client(name);
                NAME.onkeypress = null;
            }
            SLIDER = document.createElement("div");
            SLIDER.className = "center";
            SLIDER.innerHTML +=
                "<input type=\"range\" min=\"0\" max=\"359\" value=\"" + red +
                "\" id=\"slider\">";
            SLIDER.oninput = function() {
                var slider = document.getElementById("slider");
                TOKEN_COLOR = assignColors(parseInt(slider.value), 10);
                paintTokens();
                setColor(document.getElementById("slider"),
                         slider.value.toString());
            };
            LEDGER.parentNode.insertBefore(SLIDER, LEDGER);
            setColor(document.getElementById("slider"), red);
        }
    };
}, false);
