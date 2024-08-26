interface IComponent {
    update(game: Game): void;
    render(ctx: CanvasRenderingContext2D): void;
    renderOrder: number;
}


interface ICollidable {
    get collider(): Collider;
}
function iofICollidable(object: any): object is ICollidable {
    return "collider" in object;
}

interface IGrabbable {
    get handle(): Collider;
    adjustTarget(target: Vector): Vector;
}
function iofIGrabbable(object: any): object is IGrabbable {
    return "handle" in object;
}


class SimpleObstacle implements IComponent, ICollidable {
    renderOrder: number = -100;
    collider: Collider;
    constructor(points: Vector[]) {
        this.collider = new ConvexPolygonCollider(points);
    }
    update(game: Game) { }
    render(ctx: CanvasRenderingContext2D) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#889";
        ctx.fillStyle = "#1a1a1a";
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
    renderOrder: number = -300;
    facing: Vector;
    pressed: number;
    speed: number;
    width: number;
    depth: number;
    minDepth: number;
    constructor(public position: Vector, facing: Vector,
            { speed = 1, width = 40, depth = 20, minDepth = 5 }) {
        this.facing = facing.normalized();
        this.pressed = 0;
        this.speed = speed, this.width = width,
        this.depth = depth, this.minDepth = minDepth;
    }
    update(game: Game) {
        this.pressed = Math.max(this.pressed - this.speed * FRAME_INTERVAL / 1000, 0);
        // Pushed by robot hand
        // TODO allow being pushed by arm, not just end
        for (let robotArm of game.robotArms) {
            for (let i = 0; i < robotArm.armature.length; i++) {
                let relativePosition = robotArm.armature[i].end.sub(this.position).rotate(-this.facing.angle);
                let relativeCrossAxis = relativePosition.y / this.width;
                let relativeMainAxis = relativePosition.x / this.depth;
                if (-0.49 < relativeCrossAxis && relativeCrossAxis < 0.49 &&
                        0 <= relativeMainAxis && relativeMainAxis < 1) {
                    this.pressed = Math.max(this.pressed, 1 - Math.max(relativeMainAxis, this.minDepth / this.depth));
                }
            }
        }
    }
    render(ctx: CanvasRenderingContext2D): void {
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.strokeStyle = (this.output == 1) ? "#4af" : "#36f";
        ctx.fillStyle = (this.output == 1) ? "#245176" : "#09112a";
        let [brc, frc, flc, blc] = this.cornerPositions(this.pressed);
        ctx.moveTo(brc.x, brc.y);
        ctx.lineTo(frc.x, frc.y);
        ctx.lineTo(flc.x, flc.y);
        ctx.lineTo(blc.x, blc.y);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();
    }
    get collider() {
        return new ConvexPolygonCollider(this.cornerPositions(
            Math.min(this.pressed + this.speed * FRAME_INTERVAL / 1000, 0.80)
        ));
    }
    get output() {
        return Math.min(this.pressed / (1 - this.minDepth / this.depth) / 0.75, 1);
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


class ChainPull implements IComponent, IGrabbable, IOutputter {
    renderOrder: number = -150;
    held: boolean;
    endPosition: Vector;
    speed: number;
    length: number;
    maxLength: number;
    constructor(public position: Vector,
            { speed = 1, length = 80, maxLength = 160 }) {
        this.held = false;
        this.endPosition = this.position.add(new Vector(0, this.length));
        this.speed = speed, this.length = length, this.maxLength = maxLength;
    }
    update(this: ChainPull, game: Game) {
        let holders = game.heldBy(this);
        if (holders.length == 0) {
            this.endPosition = this.position.add(new Vector(0, this.length));
        } else {
            for (let robotArm of holders) {
                if (robotArm.heldObject == this) {
                    let offset = robotArm.grabber.end.sub(this.position);
                    if (offset.norm > this.maxLength) {
                        this.endPosition = this.position.add(offset.normalized().mul(this.maxLength));
                    } else {
                        this.endPosition = robotArm.grabber.end;
                    }
                }
            }
        }
    }
    render(ctx: CanvasRenderingContext2D): void {
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
        ctx.fillStyle = (this.output == 1) ? "#245176" : "#09112a";
        ctx.beginPath();
        ctx.arc(this.endPosition.x, this.endPosition.y, 10, 0, TWO_PI);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();
    }
    get handle() {
        return new CircleCollider(this.endPosition, 20);
    }
    adjustTarget(target: Vector) {
        let targetDistance = target.sub(this.position).norm;
        if (targetDistance > this.maxLength) {
            // TODO allow for resistance
            target = this.position.add(target.sub(this.position).mul(this.maxLength / targetDistance));
        }
        return target;
    }
    get output() {
        let fraction = (this.endPosition.sub(this.position).norm - this.length) / (this.maxLength - this.length);
        return Math.min(Math.max(fraction / 0.95, 0), 1);
    }
    solveCatenary(n: number) {
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
            return [new Vector(this.position.x, this.position.y + (this.length - delta.y)/2)];
        }
        let r = Math.sqrt(this.length*this.length - delta.y*delta.y) / Math.abs(delta.x);
        if (Number.isNaN(r)) {
            return [];
        }
        // Newton's method for A
        let A = (r < 3) ? Math.sqrt(6 * (r - 1)) : Math.log(2*r) + Math.log(Math.log(2*r));
        for (let i = 0; i < 5; i++) {
            A -= (Math.sinh(A) - r*A) / (Math.cosh(A) - r);
        }
        // Coefficients
        let a = delta.x / (2*A);
        let b = mean.x - a * Math.atanh(delta.y / this.length);
        let c = mean.y - this.length / (2*Math.tanh(A));
        let points: Vector[] = [];
        for (let i = 1; i < n; i++) {
            let x = nPos.x + i*step;
            let y = a * Math.cosh((nPos.x + i*delta.x/n - b) / a) + c;
            points.push(new Vector(x, y).mul(-1));
        }
        return points;
    }
}

class Lever implements IComponent, IGrabbable, IOutputter {
    renderOrder: number = -200;
    facing: Vector;
    held: boolean;
    rotation: number;
    speed: number;
    length: number;
    maxRotation: number
    constructor(public position: Vector, facing: Vector,
            { speed = 1, length = 80, maxRotation = 60 }) {
        this.facing = facing.normalized();
        this.held = false;
        this.rotation = -Math.PI / 3;
        this.speed = speed, this.length = length, this.maxRotation = maxRotation * Math.PI / 180;
    }
    update(this: Lever, game: Game) {
        let holders = game.heldBy(this);
        if (holders.length == 0) {
            this.rotation = Math.max(this.rotation - this.speed * FRAME_INTERVAL / 1000, -this.maxRotation);
        } else {
            for (let robotArm of holders) {
                this.rotation = Math.min(Math.max(
                    clipAngle(robotArm.grabber.end.sub(this.position).angle - this.facing.angle),
                    -this.maxRotation), this.maxRotation);
            }
        }
    }
    adjustTarget(target: Vector) {
        // TODO Fix up
        let targetRotation = clipAngle(target.sub(this.position).angle - this.facing.angle);
        if (targetRotation > this.rotation) {
            let resistance = Math.max(2 - 2*Math.abs(this.rotation/this.maxRotation + 0.5), 1);
            targetRotation = Math.min(targetRotation, this.rotation + this.speed * FRAME_INTERVAL / 1000 / resistance);
        } else {
            let resistance = Math.max(2 - 2*Math.abs(this.rotation/this.maxRotation - 0.5), 1);
            targetRotation = Math.max(targetRotation, this.rotation - this.speed * FRAME_INTERVAL / 1000 / resistance);
        }
        targetRotation = Math.min(Math.max(targetRotation, -this.maxRotation), this.maxRotation);
        return this.position.add(this.facing.mul(this.length).rotate(targetRotation));
    }
    render(ctx: CanvasRenderingContext2D): void {
        let endPosition = this.getEndPosition();
        ctx.lineWidth = 3;
        ctx.strokeStyle = (this.output == 1) ? "#4af" : "#36f";
        ctx.beginPath();
        ctx.moveTo(this.position.x, this.position.y);
        ctx.lineTo(endPosition.x, endPosition.y);
        ctx.stroke();
        ctx.closePath();
        ctx.fillStyle = (this.output == 1) ? "#245176" : "#09112a";
        ctx.beginPath();
        ctx.arc(endPosition.x, endPosition.y, 10, 0, TWO_PI);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();
    }
    get handle() {
        return new CircleCollider(this.getEndPosition(), 20);
    }
    get output() {
        return Math.min(Math.max((this.rotation / this.maxRotation) / 0.9, -1), 1) / 2 + 0.5;
    }
    getEndPosition() {
        return this.position.add(this.facing.mul(this.length).rotate(this.rotation));
    }
}


class Carrier implements IComponent, IInputter {
    renderOrder: number = -400;
    root: Bone;
    state: number;
    cooldown: number;
    speed: number;
    constructor(robotArm: RobotArm, public positions: Vector[], { speed = 100 }) {
        this.root = robotArm.armature[0].parent!;
        this.position = this.positions[0];
        this.state = 0;
        this.cooldown = 0;
        this.speed = speed;
    }
    update(game: Game) {
        const EPSILON = 1e-6;
        if (this.cooldown > 0) {
            let offset = this.position.sub(this.positions[this.state]);
            if (offset.norm2 > EPSILON) {
                // Move towards next position
                let mult = Math.max(1 - (this.speed * FRAME_INTERVAL / 1000) / offset.norm, 0);
                this.position = this.positions[this.state].add(offset.mul(mult));
            } else {
                this.cooldown = Math.max(this.cooldown - FRAME_INTERVAL / 1000, 0);
            }
        }
    }
    render(ctx: CanvasRenderingContext2D) {
        ctx.lineWidth = 2;
        ctx.fillStyle = "#18141f";
        for (let i = 0; i < this.positions.length; i++) {
            ctx.strokeStyle = "#3d334d";
            if (this.cooldown > 0 && (this.N == 2 || (i + 1) % this.N == this.state)) {
                ctx.strokeStyle = "#5c3d8f";
            }
            let start = this.positions[i];
            let end = this.positions[(i + 1) % this.N];
            let ortho = end.sub(start).rotate90().normalized().mul(5);
            let vtxs = [
                start.add(ortho), end.add(ortho),
                end.sub(ortho), start.sub(ortho)
            ];
            ctx.beginPath();
            ctx.moveTo(vtxs[0].x, vtxs[0].y);
            for (let j = 1; j < 4; j++) {
                ctx.lineTo(vtxs[j].x, vtxs[j].y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
        for (let i = 0; i < this.positions.length; i++) {
            ctx.strokeStyle = "#3d334d";
            if (this.cooldown > 0 && (i == this.state || (i + 1) % this.N == this.state)) {
                ctx.strokeStyle = "#5c3d8f";
            }
            ctx.beginPath();
            ctx.rect(this.positions[i].x - 30, this.positions[i].y - 30, 60, 60);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
    }
    set input(value: number) {
        if (value == 1 && this.cooldown == 0) {
            this.cooldown = 1;
            this.state = (this.state + 1) % this.N;
        }
    }
    get N() { return this.positions.length; }
    get position() { return this.root.transform.localPosition; }
    set position(value: Vector) { this.root.transform.localPosition = value; }
}