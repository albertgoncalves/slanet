var wsUri = "wss://echo.websocket.org/";
var output;

function inscribe(text) {
    var pre = document.createElement("p");
    pre.style.wordWrap = "break-word";
    pre.innerHTML = text;
    output.appendChild(pre);
}

function testWebSocket() {
    websocket = new WebSocket(wsUri);
    websocket.onopen = function(evt) {
        inscribe("CONNECTED");
        var message = "Hello, world!";
        inscribe("SENT: " + message);
        websocket.send(message);
    };
    websocket.onclose = function(evt) {
        inscribe("DISCONNECTED");
    };
    websocket.onmessage = function(evt) {
        inscribe("<span style=\"color: blue;\">RESPONSE: " + evt.data +
                 "</span>");
        websocket.close();
    };
    websocket.onerror = function(evt) {
        inscribe("<span style=\"color: red;\">ERROR:</span> " + evt.data);
    };
}

window.addEventListener("load", function() {
    output = document.getElementById("output");
    testWebSocket();
}, false);
