class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
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
    add(other) { return new Vector(this.x + other.x, this.y + other.y); }
    sub(other) { return new Vector(this.x - other.x, this.y - other.y); }
    mul(other) { return new Vector(this.x * other, this.y * other); }
    div(other) { return new Vector(this.x / other, this.y / other); }
    dot(other) { return this.x * other.x + this.y * other.y; }
    cross(other) { return this.x * other.y - this.y * other.x; }
    rotate(angle) {
        let c = Math.cos(angle);
        let s = Math.sin(angle);
        return new Vector(this.x * c - this.y * s, this.x * s + this.y * c);
    }
    rotate90() { return new Vector(-this.y, this.x); }
    toArray() { return [this.x, this.y]; }
    floor() { return new Vector(Math.floor(this.x), Math.floor(this.y)); }
    static dot(a, b) { return a.dot(b); }
    static cross(a, b) { return a.x * b.y - a.y * b.x; }
    static fromAngle(theta) { return new Vector(Math.cos(theta), Math.sin(theta)); }
    static get ZERO() { return new Vector(0, 0); }
}
const TWO_PI = 2 * Math.PI;
function clipAngle(x) {
    let theta = x % TWO_PI;
    if (theta <= -Math.PI) {
        return theta + TWO_PI;
    }
    if (theta > Math.PI) {
        return theta - TWO_PI;
    }
    return theta;
}
