var FIGURE = document.getElementById("figure");

var SHAPE = {
    rectangle: "rect",
    circle: "circle",
    triangle: "polygon",
};

var COLOR = {
    red: {
        solid: "hsl(0, 60%, 60%)",
        transparent: "hsla(0, 60%, 60%, 35%)",
    },
    green: {
        solid: "hsl(150, 50%, 55%)",
        transparent: "hsla(150, 50%, 55%, 35%)",
    },
    blue: {
        solid: "hsl(210, 75%, 55%)",
        transparent: "hsla(210, 75%, 55%, 35%)",
    },
    black: {
        solid: "hsla(0, 0%, 25%, 45%)",
        transparent: "hsla(0, 0%, 25%, 25%)",
    },
};

var WIDTH = FIGURE.offsetWidth;
var HALF_WIDTH = WIDTH / 2.0;

var HEIGHT = FIGURE.offsetHeight;

var FRAME_WIDTH = 150;
var HALF_FRAME_WIDTH = FRAME_WIDTH / 2.0;

var FRAME_HEIGHT = 200;
var HALF_FRAME_HEIGHT = FRAME_HEIGHT / 2.0;

var THIRD_FRAME_HEIGHT = FRAME_HEIGHT / 3.0;

var UNIT = 50;
var HALF_UNIT = UNIT / 2.0;

var MARGIN = 9;

var X_OFFSET = 150;
var Y_OFFSET = 25;
var X_LEFT = X_OFFSET;
var X_CENTER = HALF_WIDTH - HALF_FRAME_WIDTH;
var X_RIGHT = WIDTH - X_OFFSET - FRAME_WIDTH;
var Y_TOP = Y_OFFSET;
var Y_CENTER = (HEIGHT / 2.0) - HALF_FRAME_HEIGHT;
var Y_BOTTOM = HEIGHT - Y_OFFSET - FRAME_HEIGHT;

var X_TOKEN_LEFT = HALF_FRAME_WIDTH + X_OFFSET - HALF_UNIT;
var X_TOKEN_CENTER = HALF_WIDTH - HALF_UNIT;
var X_TOKEN_RIGHT = HALF_WIDTH + X_OFFSET;

var Y_TOKEN_THREE_CENTER = HALF_FRAME_HEIGHT - HALF_UNIT;
var Y_TOKEN_THREE_BOTTOM = FRAME_HEIGHT - MARGIN - UNIT;
var Y_TOKEN_TWO_TOP = THIRD_FRAME_HEIGHT - HALF_UNIT;
var Y_TOKEN_TWO_BOTTOM = (THIRD_FRAME_HEIGHT * 2.0) - HALF_UNIT;
var Y_TOKEN_ONE = HALF_FRAME_HEIGHT - HALF_UNIT;

var ROUTER = {
    "frame-0-0": {
        x: X_TOKEN_LEFT,
        y: Y_TOP,
    },
    "frame-0-1": {
        x: X_TOKEN_LEFT,
        y: Y_CENTER,
    },
    "frame-0-2": {
        x: X_TOKEN_LEFT,
        y: Y_BOTTOM,
    },
    "frame-1-0": {
        x: X_TOKEN_CENTER,
        y: Y_TOP,
    },
    "frame-1-1": {
        x: X_TOKEN_CENTER,
        y: Y_CENTER,
    },
    "frame-1-2": {
        x: X_TOKEN_CENTER,
        y: Y_BOTTOM,
    },
    "frame-2-0": {
        x: X_TOKEN_RIGHT,
        y: Y_TOP,
    },
    "frame-2-1": {
        x: X_TOKEN_RIGHT,
        y: Y_CENTER,
    },
    "frame-2-2": {
        x: X_TOKEN_RIGHT,
        y: Y_BOTTOM,
    },
};

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

function deleteElement(id) {
    document.getElementById(id).remove();
}

function createSvg(id, payload) {
    var svg =
        document.createElementNS("http://www.w3.org/2000/svg", payload.shape);
    var n = payload.attributes.length;
    for (var i = 0; i < n; i++) {
        svg.setAttribute(payload.attributes[i][0], payload.attributes[i][1]);
    }
    document.getElementById(id).appendChild(svg);
}

function fill(attributes, color) {
    attributes.push(["fill", color]);
}

function outline(attributes, color) {
    fill(attributes, "white");
    attributes.push(["stroke", color]);
    attributes.push(["stroke-width", "3px"]);
}

function opacity(attributes, alpha) {
    attributes.push(["opacity", alpha]);
}

function rectangle(id, width, height, x, y) {
    return {
        shape: SHAPE.rectangle,
        attributes: [
            ["id", id],
            ["width", width],
            ["height", height],
            ["x", x],
            ["y", y],
        ],
    };
}

function square(id, unit, x, y) {
    return {
        shape: SHAPE.rectangle,
        attributes: [
            ["id", id],
            ["width", unit],
            ["height", unit],
            ["x", x],
            ["y", y],
            ["pointer-events", "none"],
        ],
    };
}

function circle(id, diameter, x, y) {
    radius = diameter / 2.0;
    return {
        shape: SHAPE.circle,
        attributes: [
            ["id", id],
            ["r", radius],
            ["cx", x + radius],
            ["cy", y + radius],
            ["pointer-events", "none"],
        ],
    };
}

function triangle(id, unit, x, y) {
    return {
        shape: SHAPE.triangle,
        attributes: [
            ["id", id],
            ["points", [x, y + unit, x + unit, y + unit, x + (unit / 2.0), y]],
            ["pointer-events", "none"],
        ],
    };
}

function frame(id, x, y) {
    createSvg("canvas", function() {
        var payload = rectangle(id, FRAME_WIDTH, FRAME_HEIGHT, x, y);
        empty(payload.attributes, COLOR.black);
        return payload;
    }());
    document.getElementById(id).onclick = function(e) {
        console.log(id);
    }
}

function token(id, shape, fill, color, x, y) {
    createSvg("canvas", function() {
        var payload = shape(id, UNIT, x, y)
        fill(payload.attributes, color);
        return payload;
    }());
}

function tokenThree(id, shape, fill, color) {
    var route = ROUTER[id];
    var ids = [id + "-0", id + "-1", id + "-2"];
    token(ids[0], shape, fill, color, route.x, route.y + MARGIN);
    token(ids[1], shape, fill, color, route.x, route.y + Y_TOKEN_THREE_CENTER);
    token(ids[2], shape, fill, color, route.x, route.y + Y_TOKEN_THREE_BOTTOM);
    return ids
}

function tokenTwo(id, shape, fill, color) {
    var route = ROUTER[id];
    var ids = [id + "-0", id + "-1"];
    token(ids[0], shape, fill, color, route.x, route.y + Y_TOKEN_TWO_TOP);
    token(ids[1], shape, fill, color, route.x, route.y + Y_TOKEN_TWO_BOTTOM);
    return ids
}

function tokenOne(id, shape, fill, color) {
    var route = ROUTER[id];
    var ids = [id + "-0"];
    token(ids[0], shape, fill, color, route.x, route.y + Y_TOKEN_ONE);
    return ids
}

function background() {
    frame("frame-0-0", X_LEFT, Y_TOP);
    frame("frame-0-1", X_LEFT, Y_CENTER);
    frame("frame-0-2", X_LEFT, Y_BOTTOM);
    frame("frame-1-0", X_CENTER, Y_TOP);
    frame("frame-1-1", X_CENTER, Y_CENTER);
    frame("frame-1-2", X_CENTER, Y_BOTTOM);
    frame("frame-2-0", X_RIGHT, Y_TOP);
    frame("frame-2-1", X_RIGHT, Y_CENTER);
    frame("frame-2-2", X_RIGHT, Y_BOTTOM);
}

function demo() {
    background();
    tokenThree("frame-0-0", square, solid, COLOR.red);
    tokenThree("frame-0-1", square, transparent, COLOR.green);
    tokenThree("frame-0-2", square, empty, COLOR.blue);
    tokenTwo("frame-1-0", circle, solid, COLOR.green);
    tokenTwo("frame-1-1", circle, transparent, COLOR.blue);
    tokenTwo("frame-1-2", circle, empty, COLOR.red);
    tokenOne("frame-2-0", triangle, solid, COLOR.blue);
    tokenOne("frame-2-1", triangle, transparent, COLOR.red);
    tokenOne("frame-2-2", triangle, empty, COLOR.green);
}
