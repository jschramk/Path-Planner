class Vector {

    constructor(i, j) {
        this.i = i;
        this.j = j;
    }

    mag() {
        return Math.sqrt(this.i * this.i + this.j * this.j);
    }

    minus(v) {
        return new Vector(this.i - v.i, this.j - v.j);
    }

    plus(v) {
        return new Vector(this.i + v.i, this.j + v.j);
    }

    dot(v) {
        return this.i * v.i + this.j * v.j;
    }

    angle(v) {
        return Math.atan2(this.i * v.j - this.j * v.i, this.i * v.i + this.j * v.j);
    }

    heading() {
        return Math.atan2(this.j, this.i);
    }

    scale(factor) {
        return new Vector(this.i * factor, this.j * factor);
    }

    rotate(radians) {
        var mag = this.mag();
        var heading = this.heading() + radians;
        return Vector.headingVector(heading, mag);
    }

    static headingVector(angle, mag) {
        return new Vector(mag * Math.cos(angle), mag * Math.sin(angle));
    }

    static triangleArea(v1, v2, v3) {
        return Math.abs(v1.i * (v2.j - v3.j) + v2.i * (v3.j - v1.j) + v3.i * (v1.j - v2.j)) / 2;
    }

    static circleRadius(v1, v2, v3) {

        var a = v1.minus(v2).mag();
        var b = v2.minus(v3).mag();
        var c = v3.minus(v1).mag();

        var rad = a * b * c / (4 * this.triangleArea(v1, v2, v3));

        if (isNaN(rad) || !isFinite(rad)) {
            rad = 1e15;
        }

        return rad;

    }

}