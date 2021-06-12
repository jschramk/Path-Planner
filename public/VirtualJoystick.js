class Joystick {

    constructor(canvas) {
        this.canvas = canvas;
        this.mouseDown = false;
    }

    handleMouseDown() {
        this.mouseDown = true;
    }

    handleMouseMove() {

    }

    handleMouseMouseUp() {
        this.mouseDown = false;
    }

}