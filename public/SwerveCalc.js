var canvas = document.getElementById("turnCanvas");

var ctx = canvas.getContext("2d");

var rectBot = [new Vector(-50, 70), new Vector(50, 70), new Vector(50, -70), new Vector(-50, -70)];
var robotShape = rectBot;

var angle = 0;

var controlMode = "orbit";
var showTangents = false;

var center = new Vector(canvas.width / 2, canvas.height / 2);
var turnCenter = new Vector(canvas.width / 2 + 200, canvas.height / 2 + 0);

var maxSpeed = 50;
var left = false;

var strafeAngle = 0;
var strafeProp = 1;
var fpsTurnProp = 0;

var mouseDown = false;

var centerAngle = 0;
var centerDistance = 0;

canvas.addEventListener('mousemove', handleMouseMove, false);
canvas.addEventListener('mousedown', handleMouseDown, false);
canvas.addEventListener('mouseup', handleMouseUp, false);

initInputs();

drawAll();

function polygonBot(n, rad) {

    var pos = [];

    for (var i = 0; i < n; i++) {

        var angle = i / n * 2 * Math.PI;

        var v = Vector.headingVector(angle, rad);

        pos.push(v);

    }

    return pos;

}

function computeScreenMotorPos() {

    var screenPos = [];

    for (var i = 0; i < robotShape.length; i++) {
        screenPos.push(center.plus(robotShape[i].rotate(angle)));
    }

    return screenPos;

}

function computeOrbitVectors(screenPos, turnCenter, left) {

    var centerToMotorPos = [];

    var maxDist = 0;
    for (var i = 0; i < screenPos.length; i++) {

        var v = screenPos[i].minus(turnCenter);
        centerToMotorPos.push(v);
        maxDist = Math.max(maxDist, v.mag());

    }

    var vectors = [];

    for (var i = 0; i < centerToMotorPos.length; i++) {

        var v = centerToMotorPos[i].scale(1 / maxDist).rotate(Math.PI / 2);

        if (left) v = v.scale(-1);

        vectors.push(v);

    }

    return vectors;

}

function computeFPSVectors(screenPos) {

    var left = fpsTurnProp < 0;

    var turnVectors = computeOrbitVectors(screenPos, center, left);

    var strafeVector = Vector.headingVector(strafeAngle, strafeProp);

    var total = strafeProp + Math.abs(fpsTurnProp);

    var max = 0;
    var turns = [];
    for (var i = 0; i < turnVectors.length; i++) {
        var turn = turnVectors[i].scale(Math.abs(fpsTurnProp));
        max = Math.max(max, strafeVector.plus(turn).mag());
        turns.push(turn);
    }

    var fpsVectors = [];
    for (var i = 0; i < turnVectors.length; i++) {

        var v = strafeVector.plus(turns[i]);

        if (total > 1) {
            v = v.scale(1 / total);
        }

        fpsVectors.push(v);
    }

    return fpsVectors;

}

function drawRobot(screenPos) {

    ctx.setLineDash([]);

    ctx.strokeStyle = "#000000";
    ctx.fillStyle = "#000000";
    
    ctx.lineWidth = 2;

    ctx.font = "12px Arial";

    ctx.beginPath();
    ctx.moveTo(screenPos[0].i, screenPos[0].j);

    for (var i = 0; i < screenPos.length; i++) {
        ctx.lineTo(screenPos[i].i, screenPos[i].j);
        ctx.fillText(i, screenPos[i].i + 5, screenPos[i].j - 5);
    }
    ctx.lineTo(screenPos[0].i, screenPos[0].j);
    ctx.stroke();

    ctx.fillStyle = "rgba(0,128,255, 0.1)";
    ctx.fill();

    ctx.fillStyle = "#000000";

    ctx.beginPath();
    ctx.arc(center.i, center.j, 2, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.fill();

}

function drawOrbitCenter() {

    ctx.strokeStyle = "#000000";
    ctx.fillStyle = "#000000";

    ctx.beginPath();
    ctx.arc(turnCenter.i, turnCenter.j, 2, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.fill();

    ctx.font = "16px Arial";

    ctx.fillText("Orbit Point", turnCenter.i + 10, turnCenter.j - 10);
}

function drawMotorVectors(screenPos, motorVectors) {

    ctx.setLineDash([]);

    for (var i = 0; i < motorVectors.length; i++) {

        var pos = screenPos[i];
        var vect = motorVectors[i].scale(maxSpeed);

        var hue = vect.mag() / maxSpeed * 120;

        ctx.strokeStyle = `hsl(${hue}, 100%, 40%)`;
        ctx.beginPath();
        ctx.moveTo(pos.i, pos.j);
        ctx.lineTo(pos.plus(vect).i, pos.plus(vect).j);
        ctx.stroke();

    }

}

function drawMotorTangents(screenPos, motorVectors) {

    ctx.setLineDash([]);

    for (var i = 0; i < motorVectors.length; i++) {

        var pos = screenPos[i];
        var vect = motorVectors[i];

        var v1 = vect.rotate(Math.PI / 2).scale(1e6);
        var v2 = v1.scale(-1);

        ctx.strokeStyle = "rgba(0,0,0,0.15)";
        ctx.beginPath();
        ctx.moveTo(pos.plus(v1).i, pos.plus(v1).j);
        ctx.lineTo(pos.plus(v2).i, pos.plus(v2).j);
        ctx.stroke();

    }

}

function drawDashedLines() {

    ctx.setLineDash([5, 10]);
    ctx.lineWidth = 2;

    ctx.strokeStyle = `rgba(0,0,0,0.15)`;
    ctx.beginPath();
    ctx.moveTo(center.i, center.j);
    ctx.lineTo(turnCenter.i, turnCenter.j);
    ctx.stroke();

}

function drawAll() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var screenPos = computeScreenMotorPos();

    if(controlMode == "orbit") {
        motorVectors = computeOrbitVectors(screenPos, turnCenter, left);
        drawOrbitCenter();
        drawDashedLines();
    } else {
        motorVectors = computeFPSVectors(screenPos);
    }

    drawRobot(screenPos);

    drawMotorVectors(screenPos, motorVectors);

    if(showTangents) {
        drawMotorTangents(screenPos, motorVectors);
    }

    
}

function handleMouseDown(ev) {

    mouseDown = true;

    turnCenter = getMouseScreenPoint(ev);

    drawAll();

}

function handleMouseUp(ev) {

    mouseDown = false;

}

function handleMouseMove(ev) {

    if (mouseDown) {

        turnCenter = getMouseScreenPoint(ev);

        drawAll();

    }

}

function getMouseScreenPoint(ev) {

    var rect = canvas.getBoundingClientRect();

    var x = (ev.clientX - rect.left);

    var y = (ev.clientY - rect.top);

    return new Vector(x, y);

}

function initInputs() {


    var centerAngleSlider = document.getElementById("centerAngle");
    var centerDistanceSlider = document.getElementById("centerDistance");
    var headingSlider = document.getElementById("heading");
    var strafeAngleSlider = document.getElementById("strafeAngle");
    var frsTurnSlider = document.getElementById("fpsTurnProp");
    var strafePropSlider = document.getElementById("strafeProp");
    var controlModeSelect = document.getElementById("controlMode");
    var tangentsCheckBox = document.getElementById("showTangents");
    var shapeSlider = document.getElementById("shape");


    centerAngleSlider.addEventListener(
        'input',
        function () {

            var prop = parseFloat(centerAngleSlider.value) / 1000;

            centerAngle = 2 * Math.PI * prop;

            turnCenter = center.plus(Vector.headingVector(centerAngle, centerDistance));

            drawAll();
        }
    );

    centerDistanceSlider.addEventListener(
        'input',
        function () {
            var prop = parseFloat(centerDistanceSlider.value) / 1000;

            centerDistance = 500 * linearToInfinite(prop);

            if (!isFinite(centerDistance)) centerDistance = 1e8;

            turnCenter = center.plus(Vector.headingVector(centerAngle, centerDistance));

            drawAll();
        }
    );

    headingSlider.addEventListener(
        'input',
        function () {

            var prop = parseFloat(headingSlider.value) / 1000;

            angle = 2 * Math.PI * prop;

            drawAll();
        }
    );

    strafeAngleSlider.addEventListener(
        'input',
        function () {

            var prop = parseFloat(strafeAngleSlider.value) / 1000;

            strafeAngle = 2 * Math.PI * prop;

            drawAll();
        }
    );

    frsTurnSlider.addEventListener(
        'input',
        function () {

            fpsTurnProp = parseFloat(frsTurnSlider.value) / 500;

            drawAll();
        }
    );

    strafePropSlider.addEventListener(
        'input',
        function () {

            strafeProp = parseFloat(strafePropSlider.value) / 1000;

            drawAll();
        }
    );

    controlModeSelect.addEventListener(
        'change',
        function () {

            controlMode = controlModeSelect.value;

            drawAll();
        }
    );

    tangentsCheckBox.addEventListener(
        'change',
        function () {

            showTangents = tangentsCheckBox.checked;

            drawAll();
        }
    );

    shapeSlider.addEventListener(
        'input',
        function () {

            var shape = parseInt(shapeSlider.value);

            if(shape == 2) {
                robotShape = rectBot;
            } else {
                robotShape = polygonBot(shape, 80);
            }

            drawAll();
        }
    );


}