"use strict";

var N = 3;
var M = 12;

var STATE = {};
var SELECTION = [];
var TARGETS = [
    "0,0",
    "0,1",
    "0,2",
    "1,0",
    "1,1",
    "1,2",
    "2,0",
    "2,1",
    "2,2",
    "3,0",
    "3,1",
    "3,2",
];

var THICKNESS = "3px";

var RED = randomHue();
var TOKEN_COLOR = assignColors(RED);

var GRAY = {
    dark: function() {
        return "hsl(" + randomHue().toString() + ", 30%, 80%)";
    },
    light: function() {
        return "hsla(" + randomHue().toString() + ", 30%, 95%, 0.8)";
    },
};

var FIGURE = document.getElementById("figure");

var WIDTH = FIGURE.offsetWidth;
var THIRD_WIDTH = WIDTH / 3;
var TWO_THIRD_WIDTH = THIRD_WIDTH * 2;

var HEIGHT = FIGURE.offsetHeight;

var FRAME_WIDTH = 106;
var HALF_FRAME_WIDTH = FRAME_WIDTH / 2;

var FRAME_HEIGHT = 120;
var HALF_FRAME_HEIGHT = FRAME_HEIGHT / 2;

var THIRD_FRAME_HEIGHT = FRAME_HEIGHT / 3;

var MARGIN = 7.5;
var Y_OFFSET = 55;

var X_LEFT = -HALF_FRAME_WIDTH;
var X_CENTER_LEFT = THIRD_WIDTH - HALF_FRAME_WIDTH;
var X_CENTER_RIGHT = TWO_THIRD_WIDTH - HALF_FRAME_WIDTH;
var X_RIGHT = WIDTH - HALF_FRAME_WIDTH;

var Y_TOP = Y_OFFSET;
var Y_CENTER = (HEIGHT / 2) - HALF_FRAME_HEIGHT;
var Y_BOTTOM = HEIGHT - Y_OFFSET - FRAME_HEIGHT;

var UNIT = 30;
var HALF_UNIT = UNIT / 2;

var X_TOKEN_LEFT = -HALF_UNIT;
var X_TOKEN_CENTER_LEFT = THIRD_WIDTH - HALF_UNIT;
var X_TOKEN_CENTER_RIGHT = TWO_THIRD_WIDTH - HALF_UNIT;
var X_TOKEN_RIGHT = WIDTH - HALF_UNIT;

var Y_TOKEN_THREE_TOP = MARGIN;
var Y_TOKEN_THREE_CENTER = HALF_FRAME_HEIGHT - HALF_UNIT;
var Y_TOKEN_THREE_BOTTOM = FRAME_HEIGHT - MARGIN - UNIT;
var Y_TOKEN_TWO_TOP = THIRD_FRAME_HEIGHT - HALF_UNIT;
var Y_TOKEN_TWO_BOTTOM = (THIRD_FRAME_HEIGHT * 2) - HALF_UNIT;
var Y_TOKEN_ONE = Y_TOKEN_THREE_CENTER;

var INTERLUDE = document.getElementById("interlude");
var INTER_HEIGHT = INTERLUDE.offsetHeight - 50;
var THIRD_INTER_HEIGHT = INTER_HEIGHT * (1 / 3);
var TWO_THIRD_INTER_HEIGHT = THIRD_INTER_HEIGHT * 2;

var INTER_WIDTH = INTERLUDE.offsetWidth;
var HALF_INTER_WIDTH = INTER_WIDTH / 2;

var INTER_UNIT = 20;
var HALF_INTER_UNIT = INTER_UNIT * 1.25;
var X_INTER_OFFSET = 235;

var X_INTER_LEFT = X_INTER_OFFSET - HALF_INTER_UNIT;
var X_INTER_CENTER = HALF_INTER_WIDTH - HALF_INTER_UNIT;
var X_INTER_RIGHT = INTER_WIDTH - X_INTER_OFFSET - HALF_INTER_UNIT;

var INTER_MARGIN = 24;
var Y_INTER_OFFSET = 3;

var Y_INTER_THREE_TOP = INTER_MARGIN;
var Y_INTER_THREE_CENTER = INTER_HEIGHT / 2;
var Y_INTER_THREE_BOTTOM = INTER_HEIGHT - INTER_MARGIN;
var Y_INTER_TWO_TOP = THIRD_INTER_HEIGHT + Y_INTER_OFFSET;
var Y_INTER_TWO_BOTTOM = TWO_THIRD_INTER_HEIGHT - Y_INTER_OFFSET;
var Y_INTER_ONE = Y_INTER_THREE_CENTER;

var FRAME_ROUTER = {
    "0,0": {
        x: X_TOKEN_LEFT,
        y: Y_TOP,
    },
    "0,1": {
        x: X_TOKEN_LEFT,
        y: Y_CENTER,
    },
    "0,2": {
        x: X_TOKEN_LEFT,
        y: Y_BOTTOM,
    },
    "1,0": {
        x: X_TOKEN_CENTER_LEFT,
        y: Y_TOP,
    },
    "1,1": {
        x: X_TOKEN_CENTER_LEFT,
        y: Y_CENTER,
    },
    "1,2": {
        x: X_TOKEN_CENTER_LEFT,
        y: Y_BOTTOM,
    },
    "2,0": {
        x: X_TOKEN_CENTER_RIGHT,
        y: Y_TOP,
    },
    "2,1": {
        x: X_TOKEN_CENTER_RIGHT,
        y: Y_CENTER,
    },
    "2,2": {
        x: X_TOKEN_CENTER_RIGHT,
        y: Y_BOTTOM,
    },
    "3,0": {
        x: X_TOKEN_RIGHT,
        y: Y_TOP,
    },
    "3,1": {
        x: X_TOKEN_RIGHT,
        y: Y_CENTER,
    },
    "3,2": {
        x: X_TOKEN_RIGHT,
        y: Y_BOTTOM,
    },
};

var Y_ROUTER = [
    [Y_TOKEN_ONE],
    [Y_TOKEN_TWO_TOP, Y_TOKEN_TWO_BOTTOM],
    [Y_TOKEN_THREE_TOP, Y_TOKEN_THREE_CENTER, Y_TOKEN_THREE_BOTTOM],
];

var SHAPE_ROUTER = {
    square: square,
    circle: circle,
    triangle: triangle,
};

var FILL_ROUTER = {
    solid: solid,
    transparent: transparent,
    empty: empty,
};

var SET = [];
var SET_ATTRIBUTES = {};

var X_INTER_ROUTER = [
    X_INTER_LEFT,
    X_INTER_CENTER,
    X_INTER_RIGHT,
];

var Y_INTER_ROUTER = [
    [Y_INTER_ONE],
    [Y_INTER_TWO_TOP, Y_INTER_TWO_BOTTOM],
    [Y_INTER_THREE_TOP, Y_INTER_THREE_CENTER, Y_INTER_THREE_BOTTOM],
];

function randomHue() {
    return Math.floor(Math.random() * 359);
}

function createColor(hue) {
    var h = hue.toString();
    return {
        solid: "hsl(" + h + ", 55%, 55%)",
        transparent: "hsl(" + h + ", 55%, 85%)",
    };
}

function assignColors(hue) {
    return {
        red: createColor(hue),
        green: createColor((hue + 120) % 360),
        blue: createColor((hue + 240) % 360),
    };
}

function remove(array, index) {
    var newArray = new Array(array.length - 1);
    var offset = 0;
    var n = array.length;
    for (var i = 0; i < n; i++) {
        if (i !== index) {
            newArray[i - offset] = array[i];
        } else {
            offset += 1;
        }
    }
    return newArray;
}

function equivalent(a, b) {
    var keys = Object.getOwnPropertyNames(a);
    var n = keys.length;
    if (n !== Object.getOwnPropertyNames(b).length) {
        return false;
    }
    for (var i = 0; i < n; i++) {
        var key = keys[i];
        if (a[key] !== b[key]) {
            return false;
        }
    }
    return true;
}

function createSvg(id, payload) {
    var svg =
        document.createElementNS("http://www.w3.org/2000/svg", payload.shape);
    var n = payload.attributes.length;
    for (var i = 0; i < n; i += 2) {
        svg.setAttribute(payload.attributes[i], payload.attributes[i + 1]);
    }
    document.getElementById(id).appendChild(svg);
}

function solid(attributes, color, _) {
    attributes.push("style");
    attributes.push("fill: " + color.solid + ";");
}

function transparent(attributes, color, thickness) {
    attributes.push("stroke-width");
    attributes.push(thickness);
    attributes.push("style");
    attributes.push("fill: " + color.transparent + "; stroke: " + color.solid +
                    ";");
}

function empty(attributes, color, thickness) {
    attributes.push("stroke-width");
    attributes.push(thickness);
    attributes.push("style");
    attributes.push("fill: none; stroke: " + color.solid + ";");
}

function rectangle(id, width, height, x, y) {
    return {
        shape: "rect",
        attributes: [
            "id",
            id,
            "width",
            width,
            "height",
            height,
            "x",
            x,
            "y",
            y,
            "stroke-width",
            THICKNESS,
            "style",
            "fill: none; stroke: none;",
            "pointer-events",
            "all",
        ],
    };
}

function square(id, unit, x, y) {
    return {
        shape: "rect",
        attributes: [
            "id",
            id,
            "width",
            unit,
            "height",
            unit,
            "x",
            x,
            "y",
            y,
            "pointer-events",
            "none",
        ],
    };
}

function circle(id, diameter, x, y) {
    var radius = diameter / 2;
    return {
        shape: "circle",
        attributes: [
            "id",
            id,
            "r",
            radius,
            "cx",
            x + radius,
            "cy",
            y + radius,
            "pointer-events",
            "none",
        ],
    };
}

function triangle(id, unit, x, y) {
    return {
        shape: "polygon",
        attributes: [
            "id",
            id,
            "points",
            [x, y + unit, x + unit, y + unit, x + (unit / 2), y],
            "pointer-events",
            "none",
        ],
    };
}

function drawFrame(callback, id, x, y) {
    var payload = rectangle(id, FRAME_WIDTH, FRAME_HEIGHT, x, y);
    createSvg("figureCanvas", payload);
    var target = document.getElementById(id);
    target.addEventListener("mouseenter", function(_) {
        if (STATE.hasOwnProperty(id)) {
            target.style.fill = GRAY.light();
        }
    });
    target.addEventListener("mouseleave", function(_) {
        if (STATE.hasOwnProperty(id)) {
            target.style.fill = "none";
        }
    });
    target.onclick = function(_) {
        if (!STATE.hasOwnProperty(id)) {
            return;
        }
        var n = SELECTION.length;
        if (0 < n) {
            for (var i = 0; i < n; i++) {
                if (SELECTION[i].Id === id) {
                    target.style.stroke = "none";
                    SELECTION = remove(SELECTION, i);
                    return;
                }
            }
        }
        target.style.stroke = GRAY.dark();
        SELECTION.push(STATE[id].token);
        n = SELECTION.length;
        if (N <= n) {
            callback({
                Flag: true,
                Tokens: SELECTION,
                Message: "",
            });
            for (var j = 0; j < n; j++) {
                target = document.getElementById(SELECTION[j].Id);
                target.style.fill = "none";
                target.style.stroke = "none";
            }
            SELECTION = [];
        }
    };
}

function drawFrames(callback) {
    drawFrame(callback, "0,0", X_LEFT, Y_TOP);
    drawFrame(callback, "0,1", X_LEFT, Y_CENTER);
    drawFrame(callback, "0,2", X_LEFT, Y_BOTTOM);
    drawFrame(callback, "1,0", X_CENTER_LEFT, Y_TOP);
    drawFrame(callback, "1,1", X_CENTER_LEFT, Y_CENTER);
    drawFrame(callback, "1,2", X_CENTER_LEFT, Y_BOTTOM);
    drawFrame(callback, "2,0", X_CENTER_RIGHT, Y_TOP);
    drawFrame(callback, "2,1", X_CENTER_RIGHT, Y_CENTER);
    drawFrame(callback, "2,2", X_CENTER_RIGHT, Y_BOTTOM);
    drawFrame(callback, "3,0", X_RIGHT, Y_TOP);
    drawFrame(callback, "3,1", X_RIGHT, Y_CENTER);
    drawFrame(callback, "3,2", X_RIGHT, Y_BOTTOM);
}

function autoDraw(frameId, tokenId, unit, x, y, thickness, shape, fill,
                  color) {
    var payload = SHAPE_ROUTER[shape](tokenId, unit, x, y);
    FILL_ROUTER[fill](payload.attributes, TOKEN_COLOR[color], thickness);
    createSvg(frameId, payload);
}

function drawToken(token) {
    var route = FRAME_ROUTER[token.Id];
    var ids = new Array(token.Frequency);
    for (var i = 0; i < token.Frequency; i++) {
        ids[i] = token.Id + "," + i.toString();
    }
    var yOffset = Y_ROUTER[token.Frequency - 1];
    for (var j = 0; j < token.Frequency; j++) {
        autoDraw("figureCanvas", ids[j], UNIT, route.x, route.y + yOffset[j],
                 THICKNESS, token.Shape, token.Fill, token.Color);
    }
    STATE[token.Id] = {
        token: token,
        reset: function() {
            for (var i = 0; i < token.Frequency; i++) {
                document.getElementById(ids[i]).remove();
            }
            delete STATE[token.Id];
        }
    };
}

function deselect(id) {
    var n = SELECTION.length;
    var selection = [];
    for (var i = 0; i < n; i++) {
        if (id !== SELECTION[i].Id) {
            selection.push(SELECTION[i]);
        }
    }
    SELECTION = selection;
    var target = document.getElementById(id);
    target.style.fill = "none";
    target.style.stroke = "none";
}

function drawTokens(tokens) {
    var n = tokens.length;
    var successor = {};
    for (var i = 0; i < n; i++) {
        if (tokens[i] !== null) {
            successor[tokens[i].Id] = tokens[i];
        }
    }
    var id;
    for (var j = 0; j < M; j++) {
        id = TARGETS[j];
        if (STATE.hasOwnProperty(id) && successor.hasOwnProperty(id)) {
            if (!equivalent(STATE[id].token, successor[id])) {
                STATE[id].reset();
                drawToken(successor[id]);
                deselect(id);
            }
        } else if (STATE.hasOwnProperty(id)) {
            STATE[id].reset();
            deselect(id);
        } else if (successor.hasOwnProperty(id)) {
            drawToken(successor[id]);
        }
    }
}

function drawInterlude(tokens) {
    var n = SET.length;
    for (var i = 0; i < n; i++) {
        document.getElementById(SET[i]).remove();
    }
    SET = [];
    SET_ATTRIBUTES = {};
    var id;
    for (var j = 0; j < N; j++) {
        var token = tokens[j];
        var yOffset = Y_INTER_ROUTER[token.Frequency - 1];
        for (var k = 0; k < token.Frequency; k++) {
            id = "i-" + j.toString() + "," + k.toString();
            autoDraw("interludeCanvas", id, INTER_UNIT, X_INTER_ROUTER[j],
                     yOffset[k] + HALF_INTER_UNIT, "2.25px", token.Shape,
                     token.Fill, token.Color);
            SET.push(id);
            SET_ATTRIBUTES[id] = {
                fill: token.Fill,
                color: token.Color,
            };
        }
    }
}

function autoRoute(target, fill, color) {
    if (fill === "solid") {
        target.style.fill = TOKEN_COLOR[color].solid;
    } else if (fill === "transparent") {
        target.style.fill = TOKEN_COLOR[color].transparent;
        target.style.stroke = TOKEN_COLOR[color].solid;
    } else if (fill === "empty") {
        target.style.stroke = TOKEN_COLOR[color].solid;
    }
}

function paintTokens() {
    for (var i = 0; i < M; i++) {
        var id = TARGETS[i];
        if (STATE.hasOwnProperty(id)) {
            var token = STATE[id].token;
            var target;
            for (var j = 0; j < token.Frequency; j++) {
                autoRoute(
                    document.getElementById(token.Id + "," + j.toString()),
                    token.Fill, token.Color);
            }
        }
    }
}

function paintSet() {
    var n = SET.length;
    var target;
    var fill;
    var color;
    for (var i = 0; i < n; i++) {
        autoRoute(document.getElementById(SET[i]), SET_ATTRIBUTES[SET[i]].fill,
                  SET_ATTRIBUTES[SET[i]].color);
    }
}
