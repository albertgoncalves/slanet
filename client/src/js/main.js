"use strict";

/*  global assignColors, drawFrames, drawInterlude, drawTokens, HOST,
        paintSet, paintTokens, PORT, randomHue, RED, TOKEN_COLOR:true, WIDTH */

var CHAT_FORM = document.getElementById("chatForm");
var HISTORY = document.getElementById("history");
var INTERLUDE = document.getElementById("interlude");
var LEDGER = document.getElementById("ledger");
var NAME_INPUT = document.getElementById("nameInput");
var PRELUDE = document.getElementById("prelude");
var RE = /[^0-9a-zA-Z]/g;
var CHAT_HTML = "<input id=\"chatInput\" type=\"text\">" +
    "<input id=\"chatSubmit\" type=\"submit\" value=\"Enter\">";
var CHAT_INPUT;
var SLIDER;
var THRESHOLD = 8;
var WEBSOCKET;

function inscribe(players) {
    var html = "<tr><th>Name</th><th>Score</th></tr>";
    players.sort(function(a, b) {
        return b.Score - a.Score;
    });
    var n = players.length;
    for (var i = 0; i < n; i++) {
        var player = players[i];
        html += "<tr style=\"font-weight: bold; color: white; background:" +
            player.Color + ";\"><td>" + player.Name + "</td><td>" +
            player.Score + "</td></tr>";
    }
    LEDGER.innerHTML = html;
}

function winner(players) {
    var score = players[0].Score;
    var winners = [players[0].Name];
    var n = players.length;
    for (var i = 1; i < n; i++) {
        if (score === players[i].Score) {
            winners.push(players[i].Name);
        } else if (score < players[i].Score) {
            score = players[i].Score;
            winners = [players[i].Name];
        }
    }
    return winners;
}

function client(name) {
    WEBSOCKET = new WebSocket("ws://" + window.location.host + "/ws");
    WEBSOCKET.onopen = function() {
        var payload = {Name: name};
        WEBSOCKET.send(JSON.stringify(payload));
        drawFrames(function(payload) {
            WEBSOCKET.send(JSON.stringify(payload));
        });
        CHAT_FORM.style.opacity = 1;
        CHAT_FORM.addEventListener("submit", function(event) {
            event.preventDefault();
            var message = CHAT_INPUT.value;
            WEBSOCKET.send(JSON.stringify({
                Flag: false,
                Message: message,
            }));
            CHAT_INPUT.value = "";
        });
    };
    WEBSOCKET.onclose = function() {};
    WEBSOCKET.onmessage = function(payload) {
        var response = JSON.parse(payload.data);
        if (response.Flag) {
            var frame = response.Frame;
            if (frame.Alive) {
                inscribe(frame.Players);
                drawTokens(frame.Tokens);
                if (frame.Set != null) {
                    drawInterlude(frame.Set);
                }
            } else {
                WEBSOCKET.close();
                document.body.removeChild(INTERLUDE);
                document.body.removeChild(document.getElementById("figure"));
                document.body.removeChild(document.getElementById("base"));
                SLIDER.parentNode.removeChild(SLIDER);
                if (0 < frame.Players.length) {
                    var winners = winner(frame.Players);
                    var epilogue;
                    if (1 < winners.length) {
                        epilogue = "the winners are ";
                    } else {
                        epilogue = "the winner is ";
                    }
                    document.body.innerHTML +=
                        "<div id=\"lobby\"><p id=\"postlude\" " +
                        "class=\"text\">" + epilogue + "<strong>" +
                        winners.join("</strong> & <strong>") +
                        "</strong>, refresh page to play again</p></div>";
                }
            }
        } else {
            var messages = HISTORY.innerHTML.split("\n");
            messages.push(response.Message);
            if (messages[0] == "") {
                messages.shift();
            }
            if (THRESHOLD < messages.length) {
                messages.shift();
            }
            HISTORY.innerHTML = messages.join("\n");
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
    document.getElementById("nameForm")
        .addEventListener("submit", function(event) {
            event.preventDefault();
            var name = NAME_INPUT.value.replace(RE, "");
            if ((0 < name.length) && (name.length < 14)) {
                var red = RED.toString();
                if (name != "") {
                    document.body.removeChild(
                        document.getElementById("lobby"));
                    client(name);
                    NAME_INPUT.onkeypress = null;
                }
                var slider = document.createElement("div");
                slider.className = "center";
                slider.innerHTML +=
                    "<input type=\"range\" min=\"0\" max=\"359\" value=\"" +
                    red + "\" id=\"slider\">";
                INTERLUDE.parentNode.insertBefore(slider, INTERLUDE);
                SLIDER = document.getElementById("slider");
                SLIDER.oninput = function() {
                    TOKEN_COLOR = assignColors(parseInt(SLIDER.value), 10);
                    paintTokens();
                    paintSet();
                    setColor(SLIDER, SLIDER.value.toString());
                };
                CHAT_FORM.innerHTML = CHAT_HTML;
                CHAT_INPUT = document.getElementById("chatInput");
                setColor(SLIDER, red);
            } else {
                NAME_INPUT.value = "";
                if (0 < name.length) {
                    PRELUDE.innerHTML = "try something else, " +
                        "that <strong>name</strong> is too long";
                } else {
                    PRELUDE.innerHTML = "try something else";
                }
            }
        });
}, false);
