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
var HALF_HEIGHT = HEIGHT / 2.0;

var FRAME_WIDTH = 150;
var HALF_FRAME_WIDTH = FRAME_WIDTH / 2.0;

var FRAME_HEIGHT = 200;
var HALF_FRAME_HEIGHT = FRAME_HEIGHT / 2.0;

var THIRD_FRAME_HEIGHT = FRAME_HEIGHT / 3.0;
var TWO_THIRD_FRAME_HEIGHT = THIRD_FRAME_HEIGHT * 2.0;

var UNIT = 50;
var HALF_UNIT = UNIT / 2.0;

var MARGIN = 9;

var Y_TOKEN_THREE = {
    top: MARGIN,
    center: HALF_FRAME_HEIGHT - HALF_UNIT,
    bottom: FRAME_HEIGHT - MARGIN - UNIT,
};

var Y_TOKEN_TWO = {
    top: THIRD_FRAME_HEIGHT - HALF_UNIT,
    bottom: TWO_THIRD_FRAME_HEIGHT - HALF_UNIT,
};

var Y_TOKEN_ONE = HALF_FRAME_HEIGHT - HALF_UNIT;

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
    attributes.push(["stroke-width", "2.75px"]);
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

function background(xOffset, yOffset) {
    var xLeft = xOffset;
    var xCenter = HALF_WIDTH - HALF_FRAME_WIDTH;
    var xRight = WIDTH - xOffset - FRAME_WIDTH;
    var yTop = yOffset;
    var yCenter = HALF_HEIGHT - HALF_FRAME_HEIGHT;
    var yBottom = HEIGHT - yOffset - FRAME_HEIGHT;
    frame("frame-0-0", xLeft, yTop);
    frame("frame-0-1", xLeft, yCenter);
    frame("frame-0-2", xLeft, yBottom);
    frame("frame-1-0", xCenter, yTop);
    frame("frame-1-1", xCenter, yCenter);
    frame("frame-1-2", xCenter, yBottom);
    frame("frame-2-0", xRight, yTop);
    frame("frame-2-1", xRight, yCenter);
    frame("frame-2-2", xRight, yBottom);

    var xTokenLeft = HALF_FRAME_WIDTH + xOffset - HALF_UNIT;
    var xTokenCenter = HALF_WIDTH - HALF_UNIT;
    var xTokenRight = HALF_WIDTH + xOffset;

    token("frame-0-0-square-0", square, solid, COLOR.red, xTokenLeft, yTop + Y_TOKEN_THREE.top);
    token("frame-0-0-square-1", square, solid, COLOR.red, xTokenLeft, yTop + Y_TOKEN_THREE.center);
    token("frame-0-0-square-2", square, solid, COLOR.red, xTokenLeft, yTop + Y_TOKEN_THREE.bottom);

    token("frame-0-1-square-0", square, transparent, COLOR.green, xTokenLeft, yCenter + Y_TOKEN_THREE.top);
    token("frame-0-1-square-1", square, transparent, COLOR.green, xTokenLeft, yCenter + Y_TOKEN_THREE.center);
    token("frame-0-1-square-2", square, transparent, COLOR.green, xTokenLeft, yCenter + Y_TOKEN_THREE.bottom);

    token("frame-0-2-square-0", square, empty, COLOR.blue, xTokenLeft, yBottom + Y_TOKEN_THREE.top);
    token("frame-0-2-square-1", square, empty, COLOR.blue, xTokenLeft, yBottom + Y_TOKEN_THREE.center);
    token("frame-0-2-square-2", square, empty, COLOR.blue, xTokenLeft, yBottom + Y_TOKEN_THREE.bottom);

    token("frame-1-0-circle-0", circle, solid, COLOR.green, xTokenCenter, yTop + Y_TOKEN_TWO.top);
    token("frame-1-0-circle-1", circle, solid, COLOR.green, xTokenCenter, yTop + Y_TOKEN_TWO.bottom);

    token("frame-1-1-circle-0", circle, transparent, COLOR.blue, xTokenCenter, yCenter + Y_TOKEN_TWO.top);
    token("frame-1-1-circle-1", circle, transparent, COLOR.blue, xTokenCenter, yCenter + Y_TOKEN_TWO.bottom);

    token("frame-1-2-circle-0", circle, empty, COLOR.red, xTokenCenter, yBottom + Y_TOKEN_TWO.top);
    token("frame-1-2-circle-1", circle, empty, COLOR.red, xTokenCenter, yBottom + Y_TOKEN_TWO.bottom);

    token("frame-2-0-triange-0", triangle, solid, COLOR.blue, xTokenRight, yTop + Y_TOKEN_ONE);

    token("frame-2-1-triange-0", triangle, transparent, COLOR.red, xTokenRight, yCenter + Y_TOKEN_ONE);

    token("frame-2-2-triange-0", triangle, empty, COLOR.green, xTokenRight, yBottom + Y_TOKEN_ONE);
}

function demo() {
    background(150, 25)
}
