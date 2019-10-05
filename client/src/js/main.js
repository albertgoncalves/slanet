"use strict";

/*  global assignColors, drawFrames, drawInterlude, drawTokens, HOST,
        paintSet, paintTokens, PORT, randomHue, RED, TOKEN_COLOR:true, WIDTH */

var LEDGER = document.getElementById("ledger");
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
    WEBSOCKET = new WebSocket("ws://" + window.location.host + "/ws");
    WEBSOCKET.onopen = function() {
        var payload = {name: name};
        WEBSOCKET.send(JSON.stringify(payload));
        drawFrames(function(payload) {
            WEBSOCKET.send(JSON.stringify(payload));
        });
    };
    WEBSOCKET.onclose = function() {};
    WEBSOCKET.onmessage = function(payload) {
        var response = JSON.parse(payload.data);
        if (response.flag) {
            var frame = response.frame;
            if (frame.alive) {
                inscribe(frame.players);
                drawTokens(frame.tokens);
                if (frame.set != null) {
                    drawInterlude(frame.set);
                }
            } else {
                WEBSOCKET.close();
                document.body.removeChild(document.getElementById("figure"));
                document.body.removeChild(
                    document.getElementById("interlude"));
                document.body.removeChild(document.getElementById("base"));
                if (0 < frame.players.length) {
                    var winners = winner(frame.players);
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
        } else {
            console.log(response.message);
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
    document.getElementById("form").addEventListener(
        "submit", function(event) {
            event.preventDefault();
            var name = NAME.value;
            var red = RED.toString();
            if (name != "") {
                document.body.removeChild(document.getElementById("lobby"));
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
                paintSet();
                setColor(document.getElementById("slider"),
                         slider.value.toString());
            };
            LEDGER.parentNode.insertBefore(SLIDER, LEDGER);
            setColor(document.getElementById("slider"), red);
        });
}, false);
