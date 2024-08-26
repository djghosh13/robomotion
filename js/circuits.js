class SimpleCircuit {
    constructor(activator, responder) {
        this.activator = activator;
        this.responder = responder;
        this.renderOrder = -1000;
    }
    update(game) {
        this.responder.input = this.activator.output;
    }
    render(ctx) { }
}
class ActivatorCircuit {
    constructor(activator, responder, cooldown) {
        this.activator = activator;
        this.responder = responder;
        this.cooldown = cooldown;
        this.renderOrder = -1000;
        this.lastInput = 0;
        this.onCooldown = 0;
    }
    update(game) {
        this.onCooldown = Math.max(this.onCooldown - FRAME_INTERVAL / 1000, 0);
        let justActivated = (this.lastInput < 1) && (this.activator.output == 1);
        if (justActivated && this.onCooldown == 0) {
            this.responder.input = 1;
            this.onCooldown = this.cooldown;
        }
        else {
            this.responder.input = 0;
        }
    }
    render(ctx) { }
}
class AlwaysOn {
    constructor() {
        this.renderOrder = -1000;
        this.output = 1;
    }
    update(game) { }
    render(ctx) { }
}
class Light {
    constructor(position, { hue = 134 }) {
        this.position = position;
        this.renderOrder = -50;
        this.on = false;
        this.hue = hue;
    }
    update(game) { }
    render(ctx) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = `hsl(${this.hue}, 70%, 20%)`;
        ctx.fillStyle = `hsl(${this.hue}, 60%, 10%)`;
        if (this.on) {
            ctx.strokeStyle = `hsl(${this.hue}, 90%, 60%)`;
        }
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, 10, 0, TWO_PI);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        if (this.on) {
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, 4, 0, TWO_PI);
            ctx.stroke();
            ctx.closePath();
        }
    }
    set input(value) {
        this.on = (value == 1);
    }
}
class WireLight {
    constructor(points, { hue = 134 }) {
        this.points = points;
        this.renderOrder = -500;
        this.input = 0;
        this.hue = hue;
    }
    update(game) { }
    render(ctx) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = `hsl(${this.hue}, 70%, 20%)`;
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
        ctx.strokeStyle = `hsl(${this.hue}, 85%, 35%)`;
        if (this.input == 1) {
            ctx.strokeStyle = `hsl(${this.hue}, 90%, 60%)`;
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
class CounterLight {
    constructor(position, maxCount, { hue = 134 }) {
        this.position = position;
        this.maxCount = maxCount;
        this.renderOrder = -50;
        this.input = 0;
        this.hue = hue;
    }
    update(game) { }
    render(ctx) {
        const BOX_WIDTH = 15;
        const BOX_SPACE = 5;
        let totalWidth = (BOX_WIDTH + BOX_SPACE) * this.maxCount - BOX_SPACE;
        ctx.fillStyle = `hsl(${this.hue}, 80%, 60%)`;
        for (let i = 0; i < this.maxCount; i++) {
            if (this.input * this.maxCount <= i) {
                ctx.fillStyle = `hsl(${this.hue}, 70%, 20%)`;
            }
            ctx.beginPath();
            ctx.rect(this.position.x - totalWidth / 2 + i * (BOX_WIDTH + BOX_SPACE), this.position.y - BOX_WIDTH / 2, BOX_WIDTH, BOX_WIDTH);
            ctx.closePath();
            ctx.fill();
        }
    }
}
