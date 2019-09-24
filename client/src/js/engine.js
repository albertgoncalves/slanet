var N = 3;

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
    dark: "hsla(0, 0%, 50%, 55%)",
    light: "hsla(0, 0%, 94%, 100%)",
};

var STATE = {};
var SELECTION = [];

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

var THICKNESS = "4.5px";

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

function remove(array, index) {
    var newArray = new Array(array.length - 1);
    var offset = 0;
    for (var i = 0; i < array.length; i++) {
        if (i !== index) {
            newArray[i - offset] = array[i];
        } else {
            offset += 1;
        }
    }
    return newArray;
}

function frame(id, x, y) {
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
        for (var i = 0; i < N; i++) {
            if (SELECTION[i] === id) {
                target.style.stroke = GRAY.light;
                SELECTION = remove(SELECTION, i);
                return;
            }
        }
        target.style.stroke = GRAY.dark;
        SELECTION.push(id);
        var n = SELECTION.length;
        if (n === N) {
            console.log(SELECTION);
            for (var j = 0; j < n; j++) {
                document.getElementById(SELECTION[j]).style.stroke =
                    GRAY.light;
            }
            SELECTION = [];
        }
    };
}

function token(id, shape, fill, color, frequency) {
    var route = FRAME_ROUTER[id];
    var ids = new Array(frequency);
    for (var i = 0; i < frequency; i++) {
        ids[i] = id + "," + i.toString();
    }
    var yOffset = Y_ROUTER[frequency - 1];
    var payload;
    for (var j = 0; j < frequency; j++) {
        payload = shape(ids[j], UNIT, route.x, route.y + yOffset[j]);
        fill(payload.attributes, TOKEN_COLOR[color]);
        createSvg("canvas", payload);
    }
    STATE[id] = {
        token: {
            shape: shape.name,
            fill: fill.name,
            color: color,
            frequency: frequency,
        },
        reset: function() {
            for (var i = 0; i < frequency; i++) {
                document.getElementById(ids[i]).remove();
            }
            delete STATE[id];
        }
    };
}

function background() {
    frame("0,0", X_LEFT, Y_TOP);
    frame("0,1", X_LEFT, Y_CENTER);
    frame("0,2", X_LEFT, Y_BOTTOM);
    frame("1,0", X_CENTER, Y_TOP);
    frame("1,1", X_CENTER, Y_CENTER);
    frame("1,2", X_CENTER, Y_BOTTOM);
    frame("2,0", X_RIGHT, Y_TOP);
    frame("2,1", X_RIGHT, Y_CENTER);
    frame("2,2", X_RIGHT, Y_BOTTOM);
}

function demo() {
    background();
    token("0,0", square, solid, "red", 3);
    token("0,1", square, transparent, "green", 3);
    token("0,2", square, empty, "blue", 3);
    token("1,0", circle, solid, "green", 2);
    token("1,1", circle, transparent, "blue", 2);
    token("1,2", circle, empty, "red", 2);
    token("2,0", triangle, solid, "blue", 1);
    token("2,1", triangle, transparent, "red", 1);
    token("2,2", triangle, empty, "green", 1);
    // STATE["1,0"].reset();
    // STATE["2,1"].reset();
    // STATE["0,2"].reset();
    // token("1,0", circle, solid, "blue", 2);
    // token("2,1", triangle, transparent, "green", 1);
    // token("0,2", square, empty, "red", 3);
    // STATE["1,1"].reset();
    // STATE["0,2"].reset();
    // STATE["2,1"].reset();
    console.log(STATE);
}
