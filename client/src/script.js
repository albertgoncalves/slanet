var NAME = document.getElementById("name");
var LEDGER = document.getElementById("ledger");
var WEBSOCKET;

function client(handle) {
    WEBSOCKET = new WebSocket("ws://localhost:8080/ws");
    WEBSOCKET.onopen = function() {
        console.log("connected");
        var payload = {handle: handle};
        WEBSOCKET.send(JSON.stringify(payload));
    };
    WEBSOCKET.onclose = function() {
        console.log("disconnected");
    };
    WEBSOCKET.onmessage = function(payload) {
        var response = JSON.parse(payload.data);
        console.log(response);
        inscribe(response);
    };
    WEBSOCKET.onerror = function(err) {
        console.log(err);
    };
}

function randomColor() {
    var h = Math.floor(Math.random() * 360);
    var s = Math.floor(Math.random() * 50) + 50;
    var l = Math.floor(Math.random() * 75);
    var a = (Math.random() * 0.2) + 0.1;
    return "hsla(" + h.toString() + ", " + s.toString() + "%, " +
        l.toString() + "%, " + a.toString() + ")";
}

function inscribe(ledger) {
    var html = "<tr><th>" +
        "Handle" +
        "</th><th>" +
        "Score" +
        "</th><th>" +
        "Address" +
        "</th></tr>";
    var n = ledger.length;
    for (var i = 0; i < n; i++) {
        var l = ledger[i];
        html += "<tr style=\"background:" + randomColor() + ";\"><td>" +
            l.handle + "</td><td>" + l.score + "</td><td>" + l.address +
            "</td></tr>";
    }
    LEDGER.innerHTML = html;
}

function connect() {
    var handle = NAME.value;
    if (handle != "") {
        client(handle);
        NAME.onkeypress = function(event) {
            if (event.keyCode === 13) {
                console.log("disconnecting");
                WEBSOCKET.close();
                LEDGER.innerHTML = "";
                NAME.onkeypress = function() {
                    console.log("no-op");
                };
            }
        };
    }
}

window.addEventListener("load", function() {
    NAME.onkeypress = function(event) {
        if (event.keyCode === 13) {
            connect();
        }
    };
}, false);
