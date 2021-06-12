var t = 0;
var f = 0;
var radiusX = 0;
var maxSpeed = 120;
var k = 500;

var canvas = document.getElementById("turnCanvas");
var ctx = canvas.getContext("2d");

var turnAxisSlider = document.getElementById("myRange");
var forwardAxisSlider = document.getElementById("myRange2");
var turnAxisDisplay = document.getElementById("lin");
var forwardAxisDisplay = document.getElementById("lin2");
var turnRadiusDisplay = document.getElementById("inf");

//canvas.addEventListener('mousedown', radiusFromMouse, false);
//canvas.addEventListener('mousemove', radiusFromMouse, false);


var midy = canvas.height / 2;
var midx = canvas.width / 2;

draw();

display();

/*
function radiusFromMouse(e) {

    var rect = canvas.getBoundingClientRect();

    //return {x: e.clientX - rect.left;//, y: e.clientY - rect.top};

    r = e.clientX - rect.left - midx;

    draw();

}*/

function display() {

    t = getSignedProp(turnAxisSlider.value, turnAxisSlider.min, turnAxisSlider.max);
    f = getSignedProp(forwardAxisSlider.value, forwardAxisSlider.min, forwardAxisSlider.max);
    radiusX = k * linearInf(t);

    turnAxisDisplay.innerHTML = "Turn Proportion (t) = " + t.toFixed(3);
    turnRadiusDisplay.innerHTML = "Turn Radius (r) = " + radiusX.toFixed(3);
    forwardAxisDisplay.innerHTML = "Speed Factor = " + f.toFixed(3);

    draw();

}

function getSignedProp(curr, min, max) {
    return 2 * getProp(curr, min, max) - 1;
}

function getProp(curr, min, max) {
    return (curr - min) / (max - min);
}

function linearInf(x) {
    return (1 - Math.abs(x)) / x;
}

function draw() {

    ctx.fillStyle = "#404040";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#000000";
    ctx.strokeStyle = "#000000";

    var w = 140;
    var h = 200;

    var lx = canvas.width / 2 - w / 2;
    var rx = canvas.width / 2 + w / 2;

    var strokeRadius = Math.sign(radiusX) * Math.min(Math.abs(radiusX), 1e6);

    color = Math.min(Math.abs(radiusX) / 5, 120);

    ctx.lineWidth = 2;
    ctx.strokeStyle = `hsl(${color}, 100%, 40%)`;

    ctx.beginPath();
    ctx.arc(midx + strokeRadius, midy, Math.abs(midx + strokeRadius - lx), 0, 2 * Math.PI);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(midx + strokeRadius, midy, Math.abs(midx + strokeRadius - rx), 0, 2 * Math.PI);
    ctx.stroke();

    ctx.lineWidth = 1;
    ctx.strokeStyle = "#000000";
    ctx.fillStyle = "#c0c0c0"
    ctx.fillRect(midx - w / 2, midy - h / 2, w, h);
    ctx.strokeRect(midx - w / 2, midy - h / 2, w, h)

    var dotRadius = 1;

    ctx.lineWidth = 4;

    var absR = Math.abs(radiusX);

    var halfWidth = w / 2;

    var turnScale = halfWidth / (halfWidth + absR);
    var forwardScale = -halfWidth / (halfWidth + absR) + 1;

    var leftSpeedFactor = f * (Math.sign(t) * turnScale + forwardScale);
    var rightSpeedFactor = f * (-Math.sign(t) * turnScale + forwardScale);
    var middleSpeedFactor = f * forwardScale;

    ctx.fillStyle = "#000000"
    ctx.strokeStyle = "#000000";

    ctx.beginPath();
    ctx.arc(midx + radiusX, midy, dotRadius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(midx, midy, dotRadius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "#ff0000";

    ctx.beginPath();
    ctx.moveTo(lx, midy);
    ctx.lineTo(lx, midy + -leftSpeedFactor * maxSpeed);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(rx, midy);
    ctx.lineTo(rx, midy + -rightSpeedFactor * maxSpeed);
    ctx.stroke();

    ctx.strokeStyle = "#00cc00";

    ctx.beginPath();
    ctx.moveTo(midx, midy);
    ctx.lineTo(midx, midy + -middleSpeedFactor * maxSpeed);
    ctx.stroke();

    ctx.font = "bold 16px Arial";

    ctx.fillText("r = " + radiusX.toFixed(2), radiusX + midx + 10, midy + 10);

}