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
    constructor(position, facing, speed = 1, width = 40, depth = 20) {
        this.position = position;
        this.speed = speed;
        this.width = width;
        this.depth = depth;
        this.facing = facing.normalized();
        this.pressed = 0;
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
        ctx.strokeStyle = "#36f";
        if (this.output == 1) {
            ctx.strokeStyle = "#4af";
        }
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
class SimpleCircuit {
    constructor(activator, responder) {
        this.activator = activator;
        this.responder = responder;
    }
    update(game) {
        this.responder.input = this.activator.output;
    }
    render(ctx) { }
}
class Light {
    constructor(position, on = false) {
        this.position = position;
        this.on = on;
    }
    update(game) { }
    render(ctx) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#125221";
        if (this.on) {
            ctx.strokeStyle = "#22ff55";
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, 4, 0, TWO_PI);
            ctx.stroke();
            ctx.closePath();
        }
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, 10, 0, TWO_PI);
        ctx.stroke();
        ctx.closePath();
    }
    set input(value) {
        this.on = (value == 1);
    }
}
class WireLight {
    constructor(points, input = 0) {
        this.points = points;
        this.input = input;
    }
    update(game) { }
    render(ctx) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#125221";
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 0; i < this.points.length - 1; i++) {
            ctx.lineTo(this.points[i + 1].x, this.points[i + 1].y);
        }
        ctx.stroke();
        ctx.closePath();
        //
        let dists = [];
        for (let i = 0; i < this.points.length - 1; i++) {
            dists.push(this.points[i + 1].sub(this.points[i]).norm);
        }
        let totalDist = dists.reduce((a, x) => a + x) * this.input;
        // Draw
        ctx.strokeStyle = "#169733";
        if (this.input == 1) {
            ctx.strokeStyle = "#22ff55";
        }
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 0; i < dists.length; i++) {
            if (totalDist < dists[i]) {
                let middle = this.points[i].add(this.points[i + 1].sub(this.points[i]).mul(totalDist / dists[i]));
                ctx.lineTo(middle.x, middle.y);
                break;
            }
            totalDist -= dists[i];
            ctx.lineTo(this.points[i + 1].x, this.points[i + 1].y);
        }
        ctx.stroke();
        ctx.closePath();
    }
}
