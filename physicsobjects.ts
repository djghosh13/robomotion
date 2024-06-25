class PhysicsObject implements IComponent {
    renderOrder: number = -20;
    lastPosition: Vector;
    velocity: Vector;
    constructor(public position: Vector, public radius: number) {
        this.lastPosition = this.position;
        this.velocity = Vector.ZERO;
    }
    update(game: Game): void {
        // Get all colliders
        let colliders: Collider[] = [];
        for (let comp of game.components) {
            if (iofICollidable(comp)) {
                let collider = comp.collider;
                if (collider.properties.layer == CollisionLayer.ANY_BONE) {
                    colliders.push(comp.collider);
                }
            }
        }
        // Fix position based on collisions
        const MAX_FIXES = 4;
        for (let i = 0; i < MAX_FIXES; i++) {
            let objectCollider = new CircleCollider(this.position, this.radius);
            let collision = getObjectCollision(objectCollider, colliders);
            if (collision != null) {
                this.position = this.position.add(collision.offset);
            } else {
                break;
            }
        }
    }
    render(ctx: CanvasRenderingContext2D) { }
}


class SimpleObject extends PhysicsObject implements IGrabbable {
    width: number;
    constructor(position: Vector, { width = 20 }) {
        super(position, width * 0.4);
        this.width = width;
    }
    update(this: SimpleObject, game: Game) {
        if (game.heldObject == this) {
            let newPosition = game.robotArm.end;
            this.velocity = newPosition.sub(this.position);
            this.position = newPosition;
        } else {
            this.position = this.position.add(this.velocity);
            this.velocity = this.velocity.mul(0.9);
        }
        super.update(game);
    }
    render(ctx: CanvasRenderingContext2D) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#A45229";
        ctx.fillStyle = "#3B1F12";
        ctx.beginPath();
        ctx.moveTo(this.position.x - this.width/2, this.position.y - this.width/2);
        ctx.lineTo(this.position.x - this.width/2, this.position.y + this.width/2);
        ctx.lineTo(this.position.x + this.width/2, this.position.y + this.width/2);
        ctx.lineTo(this.position.x + this.width/2, this.position.y - this.width/2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    get handle() {
        let bound = this.width/2 + 5;
        return new ConvexPolygonCollider([
            this.position.sub(new Vector(-bound, -bound)),
            this.position.sub(new Vector(-bound, bound)),
            this.position.sub(new Vector(bound, bound)),
            this.position.sub(new Vector(bound, -bound))
        ]);
    }
    adjustTarget(target: Vector) { return target; }
}


class SimpleAttractor implements IComponent {
    renderOrder: number = 100;
    radius: number;
    speed: number;
    heldObject: SimpleObject | null;
    constructor(public position: Vector, { radius = 20, speed = 1 }) {
        this.radius = radius, this.speed = speed;
        this.heldObject = null;
    }
    update(game: Game) {
        // Get closest SimpleObject within range
        this.heldObject = null;
        let objects = game.searchComponents<SimpleObject>(SimpleObject);
        if (objects.length > 0) {
            let targetObject = objects.reduce((a, b) => {
                return (b.position.sub(this.position).norm2 < a.position.sub(this.position).norm2)
                    ? b : a;
            });
            let offset = targetObject.position.sub(this.position);
            let t = offset.norm / this.radius;
            if (t < 1) {
                this.heldObject = targetObject;
                targetObject.velocity = targetObject.velocity.sub(offset.normalized().mul(
                    this.radius * this.speed * FRAME_INTERVAL / 1000 * t
                ));
            }
        }
    }
    render(ctx: CanvasRenderingContext2D) { }
}
