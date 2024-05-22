interface IComponent {
    update(game: Game): void;
    render(ctx: CanvasRenderingContext2D): void;
}


interface ICollidable {
    get collider(): Collider;
}
function iofICollidable(object: any): object is ICollidable {
    return "collider" in object;
}


class SimpleObstacle implements IComponent, ICollidable {
    constructor(public readonly collider: Collider) { }
    update(game: Game) { }
    render(ctx: CanvasRenderingContext2D) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#778";
        this.collider.render(ctx);
    }
}


interface IOutputter {
    get output(): number;
}
interface IInputter {
    set input(value: number);
}
function iofIOutputter(object: any): object is IOutputter {
    return "output" in object;
}
function iofIInputter(object: any): object is IInputter {
    return "input" in object;
}


class Button implements IComponent, ICollidable, IOutputter {
    public facing: Vector;
    public pressed: number;

    constructor(public position: Vector, facing: Vector, public speed: number = 1,
            public width: number = 40, public depth: number = 20) {
        this.facing = facing.normalized();
        this.pressed = 0;
    }
    update(game: Game) {
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
    render(ctx: CanvasRenderingContext2D): void {
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
        return new ConvexPolygonCollider(this.cornerPositions(
            Math.min(this.pressed + this.speed * FRAME_INTERVAL / 1000, 0.80)
        ));
    }
    get output() {
        return Math.min(this.pressed / 0.75, 1);
    }

    private cornerPositions(depressedBy: number) {
        let rightwards = this.facing.rotate90();
        let backRightCorner = this.position.add(rightwards.mul(this.width / 2));
        let backLeftCorner = this.position.add(rightwards.mul(-this.width / 2));
        let frontRightCorner = backRightCorner.add(this.facing.mul(this.depth * (1 - depressedBy)));
        let frontLeftCorner = backLeftCorner.add(this.facing.mul(this.depth * (1 - depressedBy)));
        return [backRightCorner, frontRightCorner, frontLeftCorner, backLeftCorner];
    }
}


class SimpleCircuit implements IComponent {
    constructor(public activator: IOutputter, public responder: IInputter) { }
    update(game: Game): void {
        this.responder.input = this.activator.output;
    }
    render(ctx: CanvasRenderingContext2D) { }
}

class Light implements IComponent, IInputter {
    constructor(public position: Vector, public on: boolean = false) { }
    update(game: Game) { }
    render(ctx: CanvasRenderingContext2D) {
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
    set input(value: number) {
        this.on = (value == 1);
    }
}

class WireLight implements IComponent, IInputter {
    constructor(public points: Vector[], public input: number = 0) { }
    update(game: Game) { }
    render(ctx: CanvasRenderingContext2D) {
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
        let dists: number[] = [];
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