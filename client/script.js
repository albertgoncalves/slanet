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

function inscribe(ledger) {
    var html = "<ul>";
    for (var key in ledger) {
        html += "<li><b>" + key + "</b> " + ledger[key] + "</li>";
    }
    html += "</ul>";
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
