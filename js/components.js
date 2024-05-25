function iofICollidable(object) {
    return "collider" in object;
}
class SimpleObstacle {
    constructor(collider) {
        this.collider = collider;
    }
    update(game) { }
    render(ctx) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#778";
        ctx.fillStyle = "#000";
        this.collider.render(ctx);
    }
}
function iofIOutputter(object) {
    return "output" in object;
}
function iofIInputter(object) {
    return "input" in object;
}
class Button {
    constructor(position, facing, { speed = 1, width = 40, depth = 20 }) {
        this.position = position;
        this.facing = facing.normalized();
        this.pressed = 0;
        this.speed = speed, this.width = width, this.depth = depth;
    }
    update(game) {
        this.pressed = Math.max(this.pressed - this.speed * FRAME_INTERVAL / 1000, 0);
        // Pushed by robot hand
        for (let i = 0; i < game.armature.length; i++) {
            let relativePosition = game.armature[i].end.sub(this.position).rotate(-this.facing.angle);
            let relativeCrossAxis = relativePosition.y / this.width;
            let relativeMainAxis = relativePosition.x / this.depth;
            if (-0.49 < relativeCrossAxis && relativeCrossAxis < 0.49 &&
                0 <= relativeMainAxis && relativeMainAxis < 1) {
                this.pressed = Math.max(this.pressed, 1 - relativeMainAxis);
            }
        }
    }
    render(ctx) {
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.strokeStyle = (this.output == 1) ? "#4af" : "#36f";
        let [brc, frc, flc, blc] = this.cornerPositions(this.pressed);
        ctx.moveTo(brc.x, brc.y);
        ctx.lineTo(frc.x, frc.y);
        ctx.lineTo(flc.x, flc.y);
        ctx.lineTo(blc.x, blc.y);
        ctx.stroke();
        ctx.closePath();
    }
    get collider() {
        return new ConvexPolygonCollider(this.cornerPositions(Math.min(this.pressed + this.speed * FRAME_INTERVAL / 1000, 0.80)));
    }
    get output() {
        return Math.min(this.pressed / 0.75, 1);
    }
    cornerPositions(depressedBy) {
        let rightwards = this.facing.rotate90();
        let backRightCorner = this.position.add(rightwards.mul(this.width / 2));
        let backLeftCorner = this.position.add(rightwards.mul(-this.width / 2));
        let frontRightCorner = backRightCorner.add(this.facing.mul(this.depth * (1 - depressedBy)));
        let frontLeftCorner = backLeftCorner.add(this.facing.mul(this.depth * (1 - depressedBy)));
        return [backRightCorner, frontRightCorner, frontLeftCorner, backLeftCorner];
    }
}
class ChainPull {
    constructor(position, { speed = 1, length = 80, maxLength = 160 }) {
        this.position = position;
        this.held = false;
        this.endPosition = this.position.add(new Vector(0, this.length));
        this.speed = speed, this.length = length, this.maxLength = maxLength;
    }
    update(game) {
        this.held = action && game.robotArm.end.sub(this.endPosition).norm < 20;
        if (this.held) {
            this.endPosition = game.robotArm.end;
        }
        else {
            // TODO complete
            this.endPosition = this.position.add(new Vector(0, this.length));
        }
    }
    render(ctx) {
        const NLINKS = 10;
        ctx.lineWidth = 3;
        ctx.strokeStyle = (this.output == 1) ? "#4af" : "#36f";
        ctx.beginPath();
        ctx.moveTo(this.position.x, this.position.y);
        for (let point of this.solveCatenary(NLINKS)) {
            ctx.lineTo(point.x, point.y);
        }
        ctx.lineTo(this.endPosition.x, this.endPosition.y);
        ctx.stroke();
        ctx.closePath();
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(this.endPosition.x, this.endPosition.y, 10, 0, TWO_PI);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();
    }
    get collider() {
        if (this.held) {
            let pulled = Math.min(Math.max(this.endPosition.sub(this.position).norm, this.length) + (this.maxLength - this.length) * this.speed * FRAME_INTERVAL / 1000, this.maxLength);
            return new CircleConstraint(this.position, pulled, { layer: CollisionLayer.END_BONE, constraint: pulled < this.maxLength });
        }
        return new NullCollider();
    }
    get output() {
        return Math.min(Math.max((this.endPosition.sub(this.position).norm - this.length) / (this.maxLength - this.length), 0), 0.95) / 0.95;
    }
    solveCatenary(n) {
        // From https://math.stackexchange.com/questions/3557767/how-to-construct-a-catenary-of-a-specified-length-through-two-specified-points
        const EPSILON = 1e-2;
        let nPos = this.position.mul(-1);
        let nEndPos = this.endPosition.mul(-1);
        let delta = nEndPos.sub(nPos);
        let step = delta.x / n;
        delta = new Vector(Math.abs(delta.x), delta.y);
        let mean = nPos.add(delta.mul(0.5));
        if (Math.abs(delta.x) < EPSILON) {
            // Vertical line, find bottom
            return [new Vector(this.position.x, this.position.y + (this.length - delta.y) / 2)];
        }
        let r = Math.sqrt(this.length * this.length - delta.y * delta.y) / Math.abs(delta.x);
        if (Number.isNaN(r)) {
            return [];
        }
        // Newton's method for A
        let A = (r < 3) ? Math.sqrt(6 * (r - 1)) : Math.log(2 * r) + Math.log(Math.log(2 * r));
        for (let i = 0; i < 5; i++) {
            A -= (Math.sinh(A) - r * A) / (Math.cosh(A) - r);
        }
        // Coefficients
        let a = delta.x / (2 * A);
        let b = mean.x - a * Math.atanh(delta.y / this.length);
        let c = mean.y - this.length / (2 * Math.tanh(A));
        let points = [];
        for (let i = 1; i < n; i++) {
            let x = nPos.x + i * step;
            let y = a * Math.cosh((nPos.x + i * delta.x / n - b) / a) + c;
            points.push(new Vector(x, y).mul(-1));
        }
        return points;
    }
}
class Lever {
    constructor(position, facing, { speed = 1, length = 80 }) {
        this.position = position;
        this.facing = facing.normalized();
        this.held = false;
        this.rotation = -Math.PI / 3;
        this.speed = speed, this.length = length;
    }
    update(game) {
        let endPosition = this.getEndPosition();
        this.held = action && game.robotArm.end.sub(endPosition).norm < 20;
        if (this.held) {
            this.rotation = Math.min(Math.max(clipAngle(game.robotArm.end.sub(this.position).angle - this.facing.angle), -Math.PI / 3), Math.PI / 3);
        }
        else {
            this.rotation = Math.max(this.rotation - this.speed * FRAME_INTERVAL / 1000, -Math.PI / 3);
        }
    }
    render(ctx) {
        let endPosition = this.getEndPosition();
        ctx.lineWidth = 3;
        ctx.strokeStyle = (this.output == 1) ? "#4af" : "#36f";
        ctx.beginPath();
        ctx.moveTo(this.position.x, this.position.y);
        ctx.lineTo(endPosition.x, endPosition.y);
        ctx.stroke();
        ctx.closePath();
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(endPosition.x, endPosition.y, 10, 0, TWO_PI);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();
    }
    get collider() {
        if (this.held) {
            let endPosition = this.getEndPosition();
            return new EllipseConstraint(endPosition, 5, this.length * this.speed * FRAME_INTERVAL / 1000, clipAngle(this.rotation + this.facing.angle), { layer: CollisionLayer.END_BONE, constraint: Math.abs(this.rotation) < 0.99 * Math.PI / 3 });
        }
        return new NullCollider();
    }
    get output() {
        return Math.min(Math.max((this.rotation * 3 / Math.PI) / 0.95, -1), 1) / 2 + 0.5;
    }
    getEndPosition() {
        return this.position.add(this.facing.mul(this.length).rotate(this.rotation));
    }
}
