class LinearSegment {

    constructor(heading, distance) {
        this.heading = heading;
        this.distance = distance;
    }

    toJava() {
        return `new LinearSegment(${this.heading.toFixed(2)}, ${this.distance.toFixed(2)})`;
    }

    toCSV() {
        return `${this.heading.toFixed(2)}, ${this.distance.toFixed(2)}`;
    }

}

class RadialSegment {

    /*
    public static RadialSegment straight(double heading, double distance) {
        return new RadialSegment(heading, distance, -1, false);
    }

    public static RadialSegment turning(double heading, double radius, boolean left) {
        return new RadialSegment(heading, 0, radius, left);
    }
    */

    constructor(heading, distance, radius, left) {
        this.heading = heading;
        this.distance = distance;
        this.radius = radius;
        this.left = left;
    }

    isTurn() {
        return this.radius >= 0;
    }

    isTurningLeft() {
        return this.left;
    }

    toJava() {

        if (this.isTurn()) {
            return `new RadialSegment.turning(${this.heading.toFixed(2)}, ${this.radius.toFixed(2)}, ${this.left})`;
        } else {
            return `new RadialSegment.straight(${this.heading.toFixed(2)}, ${this.distance.toFixed(2)})`;
        }

    }

    toCSV() {
        return `CSV not supported for radial mode!`;
    }

}



var barrelMarkers = [
    new Vector(30, 60),
    new Vector(30, 120),
    new Vector(60, 60),
    new Vector(60, 120),
    new Vector(150, 60),
    new Vector(240, 120),
    new Vector(300, 60),
];

var slalomMarkers = [
    new Vector(30, 60),
    new Vector(30, 120),
    new Vector(60, 60),
    new Vector(60, 120),
    new Vector(120, 60),
    new Vector(150, 60),
    new Vector(180, 60),
    new Vector(210, 60),
    new Vector(240, 60),
    new Vector(300, 60),
];

var bounceMarkers = [

    new Vector(30, 60),
    new Vector(30, 120),
    new Vector(60, 60),
    new Vector(60, 120),

    new Vector(90, 30),
    new Vector(90, 60),
    new Vector(120, 120),

    new Vector(150, 60),
    new Vector(150, 120),

    new Vector(210, 60),
    new Vector(210, 120),
    new Vector(240, 60),
    new Vector(240, 120),

    new Vector(300, 60),
    new Vector(300, 120),
    new Vector(330, 60),
    new Vector(330, 120),

];

function Planner() {

    var radialSegments = [];

    var shownMarkers = barrelMarkers;

    var controlPoints = [];
    var driveSegments = [];
    var radii = [];

    var maxControlPoints = 30;
    var selectedPoint = -1;
    var closestPoint = -1;
    var mousePoint = null;
    var dragging = false;

    var snapGridDivisions = 5;

    var mouseDown = false;
    var numPoints = 0;

    var canvas = document.getElementById("pathCanvas");
    var lengthDisplay = document.getElementById("pathLength");
    var radiusSlider = document.getElementById("turnRadius");

    var editType = document.getElementById("editType");
    var fieldType = document.getElementById("fieldType");
    var showCoordsCheckBox = document.getElementById("showPointCoords");
    var snapToGridCheckBox = document.getElementById("snapToGrid");
    var showGuidelinesCheckBox = document.getElementById("guidelines");
    var alwaysFilletCheckbox = document.getElementById("alwaysAutoFillet");

    fieldType.addEventListener('change', drawAll);
    showCoordsCheckBox.addEventListener('change', drawAll);
    showGuidelinesCheckBox.addEventListener('change', drawAll);

    var pointXInput = document.getElementById("pointX");
    var pointYInput = document.getElementById("pointY");
    var pointRadiusInput = document.getElementById("radiusBox");

    pointXInput.addEventListener('keyup', handleCoordsSet);
    pointYInput.addEventListener('keyup', handleCoordsSet);
    pointRadiusInput.addEventListener('keyup', handleRadiusSet);

    document.addEventListener('keydown', handleShortcutKey);


    var ctx = canvas.getContext("2d");

    canvas.addEventListener('mousemove', handleMouseMove, false);
    canvas.addEventListener('mousedown', handleMouseDown, false);
    canvas.addEventListener('mouseup', handleMouseUp, false);

    radiusSlider.addEventListener(
        'input',
        function () {
            radii[selectedPoint] = parseFloat(radiusSlider.value);
            showSelectedPointParams();
            drawAll();
        }
    );

    alwaysFilletCheckbox.addEventListener(
        "change",
        function () {

            if (alwaysFilletCheckbox.checked) {
                setAutoRadii();
                showSelectedPointParams();
                drawAll();
            }

        }
    );

    showSelectedPointParams();
    drawAll();

    function canvasToFieldVector(v) {
        return new Vector(canvasToFieldX(v.i), canvasToFieldY(v.j));
    }

    function fieldToCanvasVector(v) {
        return new Vector(fieldToCanvasX(v.i), fieldToCanvasY(v.j));
    }

    function canvasToFieldX(x) {
        return (x / canvas.width) * 360;
    }

    function canvasToFieldY(y) {
        return (1 - y / canvas.height) * 180;
    }

    function fieldToCanvasX(x) {
        return (x / 360) * canvas.width;
    }

    function fieldToCanvasY(y) {
        return (1 - y / 180) * canvas.height;
    }

    function fieldToCanvasW(w) {
        return (w / 360) * canvas.width;
    }

    function fieldToCanvasH(h) {
        return (h / 180) * canvas.height;
    }

    function canvasToFieldW(w) {
        return (w / canvas.width) * 360;
    }

    function canvasToFieldH(h) {
        return (h / canvas.height) * 180;
    }

    function handleCoordsSet(event) {
        // Number 13 is the "Enter" key on the keyboard
        if (event.keyCode === 13) {
            // Cancel the default action, if needed
            event.preventDefault();

            setSelectedPointCoordinates();
        }
    }

    function handleRadiusSet(event) {
        // Number 13 is the "Enter" key on the keyboard
        if (event.keyCode === 13) {
            // Cancel the default action, if needed
            event.preventDefault();

            setSelectedPointRadius();
        }
    }

    function handleShortcutKey(event) {

        // do nothing if user is using input
        if (this !== event.target && (/textarea|select/i.test(event.target.nodeName) || event.target.type === "text")) {
            return;
        }

        if (event.keyCode === 65) { // a

            editType.value = "add";

        } else if (event.keyCode === 83) { // s

            editType.value = "select";

        } else if (event.keyCode === 68) { // d

            editType.value = "delete";

        } else if (event.keyCode === 77) { // m

            editType.value = "move";

        } else if (event.keyCode === 73) { // i

            editType.value = "insert";

        } else if (event.keyCode === 39) { // ->

            selectedPoint = Math.min(selectedPoint + 1, numPoints - 1);

        } else if (event.keyCode === 37) { // <-

            selectedPoint = Math.max(selectedPoint - 1, -1);

        } else {
            return;
        }

        showSelectedPointParams();
        drawAll();

        event.preventDefault();


    }


    function drawField() {

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#ffffff";

        ctx.lineWidth = 2;

        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (fieldType.value == "barrel") {

            ctx.fillStyle = "#b9ffa6"

            ctx.fillRect(0, fieldToCanvasY(120), fieldToCanvasW(60), fieldToCanvasH(60));

            shownMarkers = barrelMarkers;

        } else if (fieldType.value == "slalom") {

            ctx.fillStyle = "#b9ffa6"

            ctx.fillRect(0, fieldToCanvasY(60), fieldToCanvasW(60), fieldToCanvasH(60));

            ctx.fillStyle = "#ff9999"

            ctx.fillRect(0, fieldToCanvasY(120), fieldToCanvasW(60), fieldToCanvasH(60));

            shownMarkers = slalomMarkers;

        } else if (fieldType.value == "bounce") {

            ctx.fillStyle = "#b9ffa6"

            ctx.fillRect(0, fieldToCanvasY(120), fieldToCanvasW(60), fieldToCanvasH(60));

            ctx.fillStyle = "#ff9999"

            ctx.fillRect(fieldToCanvasX(300), fieldToCanvasY(120), fieldToCanvasW(60), fieldToCanvasH(60));

            ctx.fillStyle = "#45ff30";
            ctx.strokeStyle = "#45ff30";

            ctx.beginPath();
            ctx.arc(fieldToCanvasX(90), fieldToCanvasY(150), 10, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(fieldToCanvasX(180), fieldToCanvasY(150), 10, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(fieldToCanvasX(270), fieldToCanvasY(150), 10, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();

            shownMarkers = bounceMarkers;

        } else if (fieldType.value == "empty") return;

        var boxSize = 10;

        ctx.strokeStyle = "#000000";
        ctx.fillStyle = "#000000";

        for (var i = 0; i < shownMarkers.length; i++) {

            var vect = shownMarkers[i];

            ctx.strokeRect(fieldToCanvasX(vect.i) - boxSize / 2, fieldToCanvasY(vect.j) - boxSize / 2, boxSize, boxSize);

            ctx.beginPath();
            ctx.arc(fieldToCanvasX(vect.i), fieldToCanvasY(vect.j), 1.5, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();

        }

    }






    function drawCursor() {

        if (mousePoint == null) return;

        var fieldPoint = canvasToFieldVector(mousePoint);

        if (snapToGridCheckBox.checked) {
            fieldPoint = new Vector(
                roundToNearest(snapGridDivisions, fieldPoint.i),
                roundToNearest(snapGridDivisions, fieldPoint.j),
            );
        }

        var screenPoint = fieldToCanvasVector(fieldPoint);

        ctx.lineWidth = 2;
        ctx.lineCap = "butt";

        if (showGuidelinesCheckBox.checked) {

            ctx.setLineDash([5, 5]);

            ctx.strokeStyle = "rgba(0,0,0,0.2)";

            ctx.beginPath();

            ctx.moveTo(screenPoint.i, screenPoint.j);
            ctx.lineTo(0, screenPoint.j);

            ctx.moveTo(screenPoint.i, screenPoint.j);
            ctx.lineTo(canvas.width, screenPoint.j);

            ctx.moveTo(screenPoint.i, screenPoint.j);
            ctx.lineTo(screenPoint.i, 0);

            ctx.moveTo(screenPoint.i, screenPoint.j);
            ctx.lineTo(screenPoint.i, canvas.height);

            ctx.stroke();

        }

        ctx.setLineDash([]);

        if (mousePoint == null || (dragging && selectedPoint != -1)) return;

        ctx.strokeStyle = "rgba(0,0,0,1)";

        var length = 10;

        ctx.beginPath();
        ctx.moveTo(screenPoint.i - length, screenPoint.j);
        ctx.lineTo(screenPoint.i + length, screenPoint.j);
        ctx.moveTo(screenPoint.i, screenPoint.j - length);
        ctx.lineTo(screenPoint.i, screenPoint.j + length);
        ctx.stroke();

        ctx.font = "bold 16px Arial";

        ctx.fillStyle = "#000000";

        var fontHeight = parseInt(ctx.font.match(/\d+/), 10);

        if (showCoordsCheckBox.checked) {
            var text = `(${fieldPoint.i.toFixed(1)}, ${fieldPoint.j.toFixed(1)})`;
            ctx.fillText(text, screenPoint.i + 10, screenPoint.j + 10 + fontHeight);
        }



    }

    function drawPoints() {

        for (var point = 0; point < numPoints; point++) {

            var x = controlPoints[point].i;
            var y = controlPoints[point].j;

            var canvasX = fieldToCanvasX(x);
            var canvasY = fieldToCanvasY(y);

            var dotRadius;

            if (point == closestPoint) {
                dotRadius = 8;
            } else if (point == selectedPoint) {
                dotRadius = 6;
            } else {
                dotRadius = 4;
            }

            if (point == selectedPoint) {
                ctx.fillStyle = "#ff0000";
                ctx.strokeStyle = "#ff0000";
            } else {
                ctx.fillStyle = "#1f5eff";
                ctx.strokeStyle = "#1f5eff";
            }

            ctx.beginPath();
            ctx.arc(canvasX, canvasY, dotRadius, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.fill();

            if (point == closestPoint) {
                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.arc(canvasX, canvasY, 4, 0, 2 * Math.PI);
                ctx.stroke();
                ctx.fill();
            }

            ctx.font = "bold 16px Arial";

            ctx.fillStyle = "#000000";

            var text = (point == 0 ? "Start" : `${point}`);

            if (showCoordsCheckBox.checked) {
                text += ` (${x.toFixed(1)}, ${y.toFixed(1)})`;
            }

            ctx.fillText(text, canvasX + 10, canvasY - 10);

        }

    }

    function drawStraightPath() {

        ctx.strokeStyle = "rgba(0,0,0,0.15)"

        ctx.setLineDash([5, 10]);

        ctx.beginPath();

        for (var point = 0; point < numPoints - 1; point++) {

            var p1 = controlPoints[point];
            var p2 = controlPoints[point + 1];

            ctx.moveTo(fieldToCanvasX(p1.i), fieldToCanvasY(p1.j));

            ctx.lineTo(fieldToCanvasX(p2.i), fieldToCanvasY(p2.j));

        }

        ctx.stroke();

        ctx.setLineDash([]);

    }


    function drawRadialPath() {

        ctx.lineWidth = 3;
        ctx.lineCap = "round";

        var prevEndPoint;

        if (numPoints > 0) {
            prevEndPoint = fieldToCanvasVector(controlPoints[0]);
        }

        ctx.strokeStyle = "hsl(120, 100%, 40%)";
        ctx.setLineDash([]);

        for (var point = 0; point < numPoints - 2; point++) {

            var p1 = fieldToCanvasVector(controlPoints[point]);
            var p2 = fieldToCanvasVector(controlPoints[point + 1]);
            var p3 = fieldToCanvasVector(controlPoints[point + 2]);

            var v1 = p2.minus(p1);
            var v2 = p3.minus(p2);

            var alpha1 = v1.heading();
            var alpha2 = v2.heading();

            var startAngle;
            var endAngle;

            if (v1.angle(v2) < 0) {
                startAngle = alpha2 + Math.PI / 2;
                endAngle = alpha1 + Math.PI / 2;
            } else {
                startAngle = alpha1 - Math.PI / 2;
                endAngle = alpha2 - Math.PI / 2;
            }

            var arcStartAngle = startAngle;
            var arcEndAngle = endAngle;

            var fieldRadius = radii[point + 1];

            if (fieldRadius == null) fieldRadius = 0;

            // theta is half of the angle spanned by p1, p2, p3
            var theta = (Math.PI - alpha2 + alpha1) / 2;

            var vPrev = p2.minus(prevEndPoint);

            var requestedRadius = fieldToCanvasW(fieldRadius);

            var maxRad = Math.min(vPrev.mag(), v2.mag()) * Math.tan(theta);
            maxRad = Math.abs(maxRad);

            var canvasRadius = Math.min(maxRad, requestedRadius);

            var offsetLength = canvasRadius / Math.sin(theta);

            if (v1.angle(v2) < 0) {
                offsetLength = -offsetLength;
                var temp = startAngle;
                startAngle = endAngle;
                endAngle = temp;
            }

            var heading = alpha2 + theta;

            var offset = new Vector(offsetLength * Math.cos(heading), offsetLength * Math.sin(heading));

            var center = p2.plus(offset);

            var startPoint = center.plus(new Vector(canvasRadius * Math.cos(startAngle), canvasRadius * Math.sin(startAngle)));

            // make arc look different if it is being clipped
            if (Math.ceil(maxRad) < requestedRadius) {
                ctx.setLineDash([5, 10]);
            }

            ctx.beginPath();
            ctx.arc(center.i, center.j, canvasRadius, arcStartAngle, arcEndAngle);
            ctx.stroke();

            ctx.setLineDash([]);

            ctx.beginPath();
            ctx.moveTo(prevEndPoint.i, prevEndPoint.j);
            ctx.lineTo(startPoint.i, startPoint.j);
            ctx.stroke();

            prevEndPoint = center.plus(new Vector(canvasRadius * Math.cos(endAngle), canvasRadius * Math.sin(endAngle)));

        }

        if (numPoints > 1) {

            var endPoint = fieldToCanvasVector(controlPoints[numPoints - 1]);

            ctx.beginPath();
            ctx.moveTo(prevEndPoint.i, prevEndPoint.j);
            ctx.lineTo(endPoint.i, endPoint.j);
            ctx.stroke();
        }


    }

    function setAutoRadii() {

        for (var point = 0; point < numPoints - 2; point++) {

            var p1 = fieldToCanvasVector(controlPoints[point]);
            var p2 = fieldToCanvasVector(controlPoints[point + 1]);
            var p3 = fieldToCanvasVector(controlPoints[point + 2]);

            var v1 = p2.minus(p1);
            var v2 = p3.minus(p2);

            var alpha1 = v1.heading();
            var alpha2 = v2.heading();

            // theta is half of the angle spanned by p1, p2, p3
            var theta = (Math.PI - alpha2 + alpha1) / 2;

            var maxRad = Math.min(v1.mag() / 2, v2.mag() / 2) * Math.tan(theta);
            maxRad = Math.abs(maxRad);

            radii[point + 1] = canvasToFieldW(maxRad);

        }

    }

    function zeroAllRadii() {

        for (var point = 0; point < numPoints; point++) {

            radii[point] = 0;

        }

    }

    function computeLinearSegments() {

        driveSegments = [];

        var cumulativeHeading = 0;
        var lastHeading = 0;

        for (var i = 0; i < numPoints - 1; i++) {

            var p1 = controlPoints[i];
            var p2 = controlPoints[i + 1];

            var v = p2.minus(p1);

            var currHeading = 180 / Math.PI * -v.heading();

            var angle1 = currHeading - lastHeading;

            var angle2 = angle1 < 0 ? angle1 + 360 : angle1 - 360;

            if (Math.abs(angle1) < Math.abs(angle2)) {
                cumulativeHeading += angle1;
            } else {
                cumulativeHeading += angle2;
            }

            lastHeading = currHeading;

            var seg = new LinearSegment(cumulativeHeading, v.mag());

            driveSegments.push(seg);

        }

    }

    function computeRadialSegments() {

        // clear radial segments
        radialSegments = [];

        var cumulativeHeading = 0;
        var lastHeading = 0;

        var prevEndPoint;

        if (numPoints > 0) {
            prevEndPoint = fieldToCanvasVector(controlPoints[0]);
        }

        for (var point = 0; point < numPoints - 2; point++) {

            var p1 = fieldToCanvasVector(controlPoints[point]);
            var p2 = fieldToCanvasVector(controlPoints[point + 1]);
            var p3 = fieldToCanvasVector(controlPoints[point + 2]);

            var v1 = p2.minus(p1);
            var v2 = p3.minus(p2);

            var alpha1 = v1.heading();
            var alpha2 = v2.heading();

            var startAngle;
            var endAngle;

            var left;

            if (v1.angle(v2) < 0) {
                startAngle = alpha2 + Math.PI / 2;
                endAngle = alpha1 + Math.PI / 2;
                left = true;
            } else {
                startAngle = alpha1 - Math.PI / 2;
                endAngle = alpha2 - Math.PI / 2;
                left = false;
            }

            var headingChange = endAngle - startAngle;





            var fieldRadius = radii[point + 1];

            if (fieldRadius == null) fieldRadius = 0;

            // theta is half of the angle spanned by p1, p2, p3
            var theta = (Math.PI - alpha2 + alpha1) / 2;

            var vPrev = p2.minus(prevEndPoint);

            var requestedRadius = fieldToCanvasW(fieldRadius);

            var maxRad = Math.min(vPrev.mag(), v2.mag()) * Math.tan(theta);
            maxRad = Math.abs(maxRad);

            var canvasRadius = Math.min(maxRad, requestedRadius);

            var offsetLength = canvasRadius / Math.sin(theta);



            if (v1.angle(v2) < 0) {
                offsetLength = -offsetLength;
                var temp = startAngle;
                startAngle = endAngle;
                endAngle = temp;
            }

            var heading = alpha2 + theta;

            var offset = new Vector(offsetLength * Math.cos(heading), offsetLength * Math.sin(heading));

            var center = p2.plus(offset);

            var startPoint = center.plus(new Vector(canvasRadius * Math.cos(startAngle), canvasRadius * Math.sin(startAngle)));

            var linearVector = canvasToFieldVector(startPoint.minus(prevEndPoint));

            var linearSegment = new RadialSegment()

            radialSegments.push()

            prevEndPoint = center.plus(new Vector(canvasRadius * Math.cos(endAngle), canvasRadius * Math.sin(endAngle)));

        }

        if (numPoints > 1) {

            var endPoint = fieldToCanvasVector(controlPoints[numPoints - 1]);

            ctx.beginPath();
            ctx.moveTo(prevEndPoint.i, prevEndPoint.j);
            ctx.lineTo(endPoint.i, endPoint.j);
            ctx.stroke();
        }


    }

    function drawSpline() {

        ctx.lineWidth = 5;
        ctx.lineCap = "round";

        ctx.strokeStyle = "#0000ff";

        ctx.beginPath();

        ctx.moveTo(scPx[0], scPy[0]);

        //lengthDisplay.innerHTML = `Length = ${(totalLength / 12).toFixed(2)} ft<br>Time = ${(totalTimeMillis / 1000).toFixed(2)} s`;
        lengthDisplay.innerHTML = `Length = ${(totalLength / 12).toFixed(2)} ft<br>Time = not calculated`;

    }

    function drawAll() {

        drawField();
        drawStraightPath();
        drawRadialPath();
        drawCursor();
        drawPoints();

    }

    function setSelectedPointCoordinates() {

        if (selectedPoint == -1) return;

        var x = parseFloat(pointXInput.value);
        var y = parseFloat(pointYInput.value);

        if (isNaN(x) || isNaN(y)) {
            alert("Please enter valid point coordinates.");
            return;
        }

        controlPoints[selectedPoint] = new Vector(x, y);

        showSelectedPointParams();

        drawAll();

    }

    function setSelectedPointRadius() {

        if (selectedPoint == -1) return;

        var rad = parseFloat(pointRadiusInput.value);

        if (isNaN(rad)) {
            alert("Please enter a valid radius.");
            return;
        }

        radii[selectedPoint] = rad;

        showSelectedPointParams();

        drawAll();

    }

    function showSelectedPointParams() {

        var x, y, rad;

        if (selectedPoint == -1) {

            rad = 0;
            x = 0;
            y = 0;

        } else {

            rad = radii[selectedPoint];

            if (rad == null) {
                rad = 0;
            }

            x = controlPoints[selectedPoint].i;
            y = controlPoints[selectedPoint].j;

        }

        pointXInput.value = x.toFixed(1);
        pointYInput.value = y.toFixed(1);
        pointRadiusInput.value = rad.toFixed(1);
        radiusSlider.value = rad.toFixed(0);

        if (selectedPoint == 0) {
            document.getElementById("selectedPoint").innerHTML = `Starting Point`;
        } else if (selectedPoint != -1) {
            document.getElementById("selectedPoint").innerHTML = `Point ${selectedPoint}`;
        } else {
            document.getElementById("selectedPoint").innerHTML = `No Point Selected`;
        }

        if (selectedPoint == -1) {
            pointXInput.style.visibility = "hidden";
            pointYInput.style.visibility = "hidden";
            document.getElementById("labelX").style.visibility = "hidden";
            document.getElementById("labelY").style.visibility = "hidden";
        } else {
            pointXInput.style.visibility = "visible";
            pointYInput.style.visibility = "visible";
            document.getElementById("labelX").style.visibility = "visible";
            document.getElementById("labelY").style.visibility = "visible";
        }

        if (selectedPoint < 1 || selectedPoint > numPoints - 2) {
            pointRadiusInput.style.visibility = "hidden";
            radiusSlider.style.visibility = "hidden";
            document.getElementById("labelRad").style.visibility = "hidden";
        } else {
            pointRadiusInput.style.visibility = "visible";
            radiusSlider.style.visibility = "visible";
            document.getElementById("labelRad").style.visibility = "visible";
        }

    }



    function handleMouseDown(ev) {

        document.activeElement.blur();

        mouseDown = true;

        mousePoint = getMouseScreenPoint(ev);

        closestPoint = getClosestControlPointIndex(mousePoint);

        selectedPoint = closestPoint;

        radiusSlider.value = radii[selectedPoint] == null ? 0 : radii[selectedPoint];

        if (editType.value == "move") {

            movePoint(selectedPoint, mousePoint);
            dragging = true;

        } else if (editType.value == "delete") {

            deletePoint(selectedPoint);

        } else if (editType.value == "insert") {

            insertPoint(selectedPoint + 1, mousePoint);

        } else if (editType.value == "add") {

            addPoint(mousePoint);

        }


        if (alwaysFilletCheckbox.checked) {
            setAutoRadii();
        }

        showSelectedPointParams();

        drawAll();

        ev.preventDefault();

    }

    function handleMouseUp(ev) {
        mouseDown = false;
        dragging = false;
        drawAll();
        ev.preventDefault();
    }

    function handleMouseMove(ev) {

        mousePoint = getMouseScreenPoint(ev);

        closestPoint = getClosestControlPointIndex(mousePoint);

        if (mouseDown && editType.value == "move") {
            movePoint(selectedPoint, mousePoint);

            if (alwaysFilletCheckbox.checked) {
                setAutoRadii();
            }

            showSelectedPointParams();
        }

        drawAll();

        ev.preventDefault();

    }

    function addPoint(screenPoint) {
        insertPoint(numPoints, screenPoint);
    }

    function insertPoint(index, screenPoint) {

        if (index == -1) {
            return;
        }

        selectedPoint = index;
        closestPoint = index;

        if (numPoints >= maxControlPoints) {
            alert("Sorry, you can only use " + maxControlPoints + " control points.");
            return;
        }

        numPoints++;

        for (var i = numPoints - 1; i > index; i--) {
            controlPoints[i] = controlPoints[i - 1];
            radii[i] = radii[i - 1];
        }

        var x = canvasToFieldX(screenPoint.i);
        var y = canvasToFieldY(screenPoint.j);

        if (snapToGridCheckBox.checked) {
            x = roundToNearest(snapGridDivisions, x);
            y = roundToNearest(snapGridDivisions, y);
        }

        controlPoints[index] = new Vector(x, y);

    }

    function deletePoint(index) {

        if (index == -1) {
            return;
        }

        for (var i = index; i < numPoints; i++) {
            controlPoints[i] = controlPoints[i + 1];
            radii[i] = radii[i + 1];
        }

        numPoints--;

    }

    function movePoint(index, screenPoint) {

        if (index == -1) {
            return;
        }

        var x = canvasToFieldX(screenPoint.i);
        var y = canvasToFieldY(screenPoint.j);

        if (snapToGridCheckBox.checked) {
            x = roundToNearest(snapGridDivisions, x);
            y = roundToNearest(snapGridDivisions, y);
        }

        controlPoints[index] = new Vector(x, y);
    }

    function getMouseScreenPoint(ev) {

        var rect = canvas.getBoundingClientRect();

        var x = (ev.clientX - rect.left);

        var y = (ev.clientY - rect.top);

        return new Vector(x, y);

    }

    function getClosestControlPointIndex(screenPoint) {

        var fieldPoint = new Vector(
            canvasToFieldX(screenPoint.i),
            canvasToFieldY(screenPoint.j)
        );

        var minDist = Number.POSITIVE_INFINITY;

        var threshInches = 20;

        var nearest = -1;

        for (var i = 0; i < numPoints; i++) {

            var dist = fieldPoint.minus(controlPoints[i]).mag();

            if (dist < minDist && dist < threshInches) {
                minDist = dist;
                nearest = i;
            }

        }

        // returns -1 if there is not one in range
        return nearest;

    }

    function roundToNearest(roundTo, input) {
        return Math.round(input / roundTo) * roundTo;
    }

    function download(filename, text) {

        var element = document.createElement('a');

        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));

        element.setAttribute('download', filename);

        element.style.display = 'none';

        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);

    }

    function generateJavaClass() {

        computeLinearSegments();

        var text = "package frc.robot;\n\npublic class GeneratedPath {\n\n"

        text += `  // segments: ${driveSegments.length}\n  // heading mode: cumulative\n`;

        text += "  public static LinearSegment[] MAIN = new LinearSegment[] {\n";

        for (var i = 0; i < driveSegments.length; i++) {
            if (i > 0) {
                text += ",\n";
            }
            text += "    " + driveSegments[i].toJava();
        }

        text += "\n  };\n\n}"

        return text;
    }

    function generateJavaSegmentArray() {

        computeLinearSegments();

        var text = `// segments: ${driveSegments.length}\n// heading mode: cumulative\n`;

        text += "public static LinearSegment[] MAIN = new LinearSegment[] {\n";

        for (var i = 0; i < driveSegments.length; i++) {
            if (i > 0) {
                text += ",\n";
            }
            text += "  " + driveSegments[i].toJava();
        }

        text += "\n};"

        return text;
    }

    function generateCSVFile() {

        computeLinearSegments();

        var text = "";

        for (var i = 0; i < driveSegments.length; i++) {
            if (i > 0) {
                text += "\n";
            }
            text += driveSegments[i].toCSV();
        }

    }

    document.getElementById("saveButton1").addEventListener(
        "click",
        function () {
            download("GeneratedPath.java", generateJavaClass());
        },
        false
    );

    document.getElementById("saveButton2").addEventListener(
        "click",
        function () {
            download("path.csv", generateCSVFile());
        },
        false
    );



    document.getElementById("zeroFillet").addEventListener(
        "click",
        function () {
            zeroAllRadii();
            showSelectedPointParams();
            drawAll();
        },
        false
    );

    function getDateString() {
        const date = new Date();
        const year = date.getFullYear();
        const month = `${date.getMonth() + 1}`.padStart(2, '0');
        const day = `${date.getDate()}`.padStart(2, '0');
        const hour = `${date.getHours()}`.padStart(2, '0');
        const min = `${date.getMinutes()}`.padStart(2, '0');
        const sec = `${date.getSeconds()}`.padStart(2, '0');
        return `${hour}${min}${sec}_${month}${day}${year}`
    }

    function loadPathFromCSV(allText) {

        var lines = allText.split(/\r\n|\n/);

        var loadedPoints = [];
        var loadedRadii = [];

        for (var i = 0; i < lines.length; i++) {

            var entries = lines[i].split(',');

            var x = parseFloat(entries[0]);
            var y = parseFloat(entries[1]);
            var rad = parseFloat(entries[2]);

            if (isNaN(x) || isNaN(y) || isNaN(rad)) continue;

            var v = new Vector(x, y);

            loadedPoints.push(v);
            loadedRadii.push(rad);

        }

        controlPoints = loadedPoints;
        radii = loadedRadii;
        numPoints = loadedPoints.length;

        selectedPoint = -1;
        closestPoint = -1;
        showSelectedPointParams();
        drawAll();

    }

    function loadPathFile() {

        var reader = new FileReader();

        reader.onload = function () {

            var text = reader.result.trim();

            console.log(text);

            loadPathFromCSV(text);

        };
        // start reading the file. When it is done, calls the onload event defined above.
        reader.readAsBinaryString(fileInput.files[0]);
    };

    var fileInput = document.getElementById("inputfile");

    var exportPreview = document.getElementById("codeOutput");
    var previewButton = document.getElementById("previewButton");

    previewButton.addEventListener(
        'click',
        function () {

            exportPreview.innerHTML = generateJavaSegmentArray();

        },
        false
    );

    fileInput.addEventListener('change', loadPathFile);

    document.getElementById("saveButton3").addEventListener(
        'click',
        function () {

            var text = "";

            for (var i = 0; i < numPoints; i++) {

                var point = controlPoints[i];

                var rad = radii[i];

                if (rad == null) rad = 0;

                text += `${point.i.toFixed(2)}, ${point.j.toFixed(2)}, ${rad.toFixed(2)}\n`;

            }

            download(`${getDateString()}.path`, text);

        },
        false
    );


}