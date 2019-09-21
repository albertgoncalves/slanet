var URI = "ws://localhost:8080/echo";
var RESPONSE;

function inscribe(text) {
    var pre = document.createElement("p");
    pre.style.wordWrap = "break-word";
    pre.innerHTML = text;
    RESPONSE.appendChild(pre);
}

function main() {
    websocket = new WebSocket(URI);
    websocket.onopen = function() {
        inscribe("CONNECTED");
        var message = "Hello, world!";
        inscribe("SENT: " + message);
        websocket.send(message);
    };
    websocket.onclose = function() {
        inscribe("DISCONNECTED");
    };
    websocket.onmessage = function(e) {
        inscribe("<span style=\"color: blue;\">RESPONSE: " + e.data +
                 "</span>");
        var message = "Hello, again!";
        websocket.close();
    };
    websocket.onerror = function(e) {
        inscribe("<span style=\"color: red;\">ERROR:</span> " + e.data);
    };
}

window.addEventListener("load", function() {
    RESPONSE = document.getElementById("response");
    main();
}, false);
