var URI = "ws://localhost:8080/ws";
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
        var message = JSON.stringify({message: "Client says, \"Hello!\""});
        inscribe("SENT: " + message);
        websocket.send(message);
    };
    websocket.onclose = function() {
        inscribe("DISCONNECTED");
    };
    websocket.onmessage = function(e) {
        var message = JSON.parse(e.data).message;
        inscribe("<span style=\"color: blue;\">RESPONSE: " + message +
                 "</span>");
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
