class Vector {
    constructor(public readonly x: number, public readonly y: number) { }
    get norm2() { return this.dot(this); }
    get norm() { return Math.sqrt(this.norm2); }
    get angle() { return Math.atan2(this.y, this.x); }
    normalized() {
        const EPSILON = 1e-8;
        if (this.norm2 < EPSILON) {
            return this;
        }
        return this.div(this.norm);
    }
    add(other: Vector) { return new Vector(this.x + other.x, this.y + other.y); }
    sub(other: Vector) { return new Vector(this.x - other.x, this.y - other.y); }
    mul(other: number) { return new Vector(this.x * other, this.y * other); }
    div(other: number) { return new Vector(this.x / other, this.y / other); }
    dot(other: Vector) { return this.x * other.x + this.y * other.y; }
    cross(other: Vector) { return this.x * other.y - this.y * other.x; }
    rotate(angle: number) {
        let c = Math.cos(angle);
        let s = Math.sin(angle);
        return new Vector(this.x * c - this.y * s, this.x * s + this.y * c);
    }
    toArray() { return [this.x, this.y]; }
    static dot(a: Vector, b: Vector) { return a.dot(b); }
    static cross(a: Vector, b: Vector) { return a.x * b.y - a.y * b.x; }
    static get ZERO() { return new Vector(0, 0); }
}


const TWO_PI: number = 2 * Math.PI;

function clipAngle(x: number) {
    let theta = x % TWO_PI;
    if (theta < -Math.PI) {
        return theta + TWO_PI;
    }
    if (theta > Math.PI) {
        return theta - TWO_PI;
    }
    return theta;
}
