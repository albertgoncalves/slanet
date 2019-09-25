var N = 3;
var M = 9;

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
];

var THICKNESS = "4.5px";

var TOKEN_COLOR = {
    red: {
        solid: "hsl(350, 50%, 60%)",
        transparent: "hsla(350, 50%, 60%, 40%)",
    },
    green: {
        solid: "hsl(150, 50%, 55%)",
        transparent: "hsla(150, 50%, 55%, 40%)",
    },
    blue: {
        solid: "hsl(210, 75%, 55%)",
        transparent: "hsla(210, 75%, 55%, 40%)",
    },
};

var GRAY = {
    dark: "hsla(0, 0%, 65%, 55%)",
    light: "hsla(0, 0%, 95%, 100%)",
};

var STATE = {};
var MANEUVER = [];

var FIGURE = document.getElementById("figure");

var WIDTH = FIGURE.offsetWidth;
var HALF_WIDTH = WIDTH / 2;
var HEIGHT = FIGURE.offsetHeight;

var FRAME_WIDTH = 150;
var HALF_FRAME_WIDTH = FRAME_WIDTH / 2;

var FRAME_HEIGHT = 200;
var HALF_FRAME_HEIGHT = FRAME_HEIGHT / 2;

var THIRD_FRAME_HEIGHT = FRAME_HEIGHT / 3;

var UNIT = 50;
var HALF_UNIT = UNIT / 2;

var MARGIN = 9;
var X_OFFSET = 150;
var Y_OFFSET = 25;

var X_LEFT = X_OFFSET;
var X_CENTER = HALF_WIDTH - HALF_FRAME_WIDTH;
var X_RIGHT = WIDTH - X_OFFSET - FRAME_WIDTH;
var Y_TOP = Y_OFFSET;
var Y_CENTER = (HEIGHT / 2) - HALF_FRAME_HEIGHT;
var Y_BOTTOM = HEIGHT - Y_OFFSET - FRAME_HEIGHT;

var X_TOKEN_LEFT = HALF_FRAME_WIDTH + X_OFFSET - HALF_UNIT;
var X_TOKEN_CENTER = HALF_WIDTH - HALF_UNIT;
var X_TOKEN_RIGHT = WIDTH - X_OFFSET - HALF_FRAME_WIDTH - HALF_UNIT;

var Y_TOKEN_THREE_TOP = MARGIN;
var Y_TOKEN_THREE_CENTER = HALF_FRAME_HEIGHT - HALF_UNIT;
var Y_TOKEN_THREE_BOTTOM = FRAME_HEIGHT - MARGIN - UNIT;
var Y_TOKEN_TWO_TOP = THIRD_FRAME_HEIGHT - HALF_UNIT;
var Y_TOKEN_TWO_BOTTOM = (THIRD_FRAME_HEIGHT * 2) - HALF_UNIT;
var Y_TOKEN_ONE = HALF_FRAME_HEIGHT - HALF_UNIT;

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
        x: X_TOKEN_CENTER,
        y: Y_TOP,
    },
    "1,1": {
        x: X_TOKEN_CENTER,
        y: Y_CENTER,
    },
    "1,2": {
        x: X_TOKEN_CENTER,
        y: Y_BOTTOM,
    },
    "2,0": {
        x: X_TOKEN_RIGHT,
        y: Y_TOP,
    },
    "2,1": {
        x: X_TOKEN_RIGHT,
        y: Y_CENTER,
    },
    "2,2": {
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
    var aKeys = Object.getOwnPropertyNames(a);
    var n = aKeys.length;
    if (n != Object.getOwnPropertyNames(b).length) {
        return false;
    }
    for (var i = 0; i < n; i++) {
        var key = aKeys[i];
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

function fill(attributes, color) {
    attributes.push("fill");
    attributes.push(color);
}

function outline(attributes, color) {
    fill(attributes, "none");
    attributes.push("stroke");
    attributes.push(color);
    attributes.push("stroke-width");
    attributes.push(THICKNESS);
}

function opacity(attributes, alpha) {
    attributes.push("opacity");
    attributes.push(alpha);
}

function solid(attributes, color) {
    fill(attributes, color.solid);
}

function empty(attributes, color) {
    outline(attributes, color.solid);
}

function transparent(attributes, color) {
    outline(attributes, color.solid);
    fill(attributes, color.transparent);
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
            "fill",
            "white",
            "stroke",
            GRAY.light,
            "stroke-width",
            THICKNESS,
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
    radius = diameter / 2;
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
    createSvg("canvas", payload);
    var target = document.getElementById(id);
    target.addEventListener("mouseenter", function(_) {
        if (STATE.hasOwnProperty(id)) {
            target.style.fill = GRAY.light;
        }
    });
    target.addEventListener("mouseleave", function(_) {
        if (STATE.hasOwnProperty(id)) {
            target.style.fill = "white";
        }
    });
    target.onclick = function(_) {
        if (!STATE.hasOwnProperty(id)) {
            return;
        }
        var n = MANEUVER.length;
        if (0 < n) {
            for (var i = 0; i < n; i++) {
                if (MANEUVER[i].id === id) {
                    target.style.stroke = GRAY.light;
                    MANEUVER = remove(MANEUVER, i);
                    return;
                }
            }
        }
        target.style.stroke = GRAY.dark;
        MANEUVER.push(STATE[id].token);
        n = MANEUVER.length;
        if (N <= n) {
            callback(MANEUVER);
            for (var j = 0; j < n; j++) {
                document.getElementById(MANEUVER[j].id).style.stroke =
                    GRAY.light;
            }
            MANEUVER = [];
        }
    };
}

function drawFrames(callback) {
    drawFrame(callback, "0,0", X_LEFT, Y_TOP);
    drawFrame(callback, "0,1", X_LEFT, Y_CENTER);
    drawFrame(callback, "0,2", X_LEFT, Y_BOTTOM);
    drawFrame(callback, "1,0", X_CENTER, Y_TOP);
    drawFrame(callback, "1,1", X_CENTER, Y_CENTER);
    drawFrame(callback, "1,2", X_CENTER, Y_BOTTOM);
    drawFrame(callback, "2,0", X_RIGHT, Y_TOP);
    drawFrame(callback, "2,1", X_RIGHT, Y_CENTER);
    drawFrame(callback, "2,2", X_RIGHT, Y_BOTTOM);
}

function drawToken(token) {
    var route = FRAME_ROUTER[token.id];
    var ids = new Array(token.frequency);
    for (var i = 0; i < token.frequency; i++) {
        ids[i] = token.id + "," + i.toString();
    }
    var yOffset = Y_ROUTER[token.frequency - 1];
    var payload;
    for (var j = 0; j < token.frequency; j++) {
        payload = SHAPE_ROUTER[token.shape](ids[j], UNIT, route.x,
                                            route.y + yOffset[j]);
        FILL_ROUTER[token.fill](payload.attributes, TOKEN_COLOR[token.color]);
        createSvg("canvas", payload);
    }
    STATE[token.id] = {
        token: token,
        reset: function() {
            for (var i = 0; i < token.frequency; i++) {
                document.getElementById(ids[i]).remove();
            }
            delete STATE[token.id];
        }
    };
}

function drawTokens(tokens) {
    var n = tokens.length;
    var successor = {};
    for (var i = 0; i < n; i++) {
        successor[tokens[i].id] = tokens[i];
    }
    var id;
    for (var j = 0; j < M; j++) {
        id = TARGETS[j];
        if (STATE.hasOwnProperty(id) && successor.hasOwnProperty(id)) {
            if (!equivalent(STATE[id].token, successor[id])) {
                console.log("redraw " + id);
                STATE[id].reset();
                drawToken(successor[id]);
            } else {
                console.log("no-op " + id);
            }
        } else if (STATE.hasOwnProperty(id)) {
            console.log("delete " + id);
            STATE[id].reset();
        } else if (successor.hasOwnProperty(id)) {
            console.log("create " + id);
            drawToken(successor[id]);
        }
    }
}

function demo() {
    drawTokens([
        {
            id: "0,0",
            shape: "square",
            fill: "solid",
            color: "red",
            frequency: 3,
        },
        {
            id: "0,1",
            shape: "square",
            fill: "transparent",
            color: "red",
            frequency: 3,
        },
        {
            id: "1,0",
            shape: "circle",
            fill: "solid",
            color: "green",
            frequency: 2,
        },
        {
            id: "2,2",
            shape: "triangle",
            fill: "empty",
            color: "green",
            frequency: 1,
        },
    ]);
    drawTokens([
        {
            id: "0,0",
            shape: "square",
            fill: "solid",
            color: "red",
            frequency: 3,
        },
        {
            id: "0,1",
            shape: "square",
            fill: "transparent",
            color: "green",
            frequency: 3,
        },
        {
            id: "0,2",
            shape: "square",
            fill: "empty",
            color: "blue",
            frequency: 3,
        },
        {
            id: "1,0",
            shape: "circle",
            fill: "solid",
            color: "green",
            frequency: 2,
        },
        {
            id: "1,1",
            shape: "circle",
            fill: "transparent",
            color: "blue",
            frequency: 2,
        },
        {
            id: "1,2",
            shape: "circle",
            fill: "empty",
            color: "red",
            frequency: 2,
        },
        {
            id: "2,0",
            shape: "triangle",
            fill: "solid",
            color: "blue",
            frequency: 1,
        },
        {
            id: "2,1",
            shape: "triangle",
            fill: "transparent",
            color: "red",
            frequency: 1,
        },
    ]);
}
