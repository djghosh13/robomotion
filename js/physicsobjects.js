class PhysicsObject {
    constructor(position, radius) {
        this.position = position;
        this.radius = radius;
        this.renderOrder = -20;
        this.lastPosition = this.position;
        this.velocity = Vector.ZERO;
    }
    update(game) {
        // Get all colliders
        let colliders = [];
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
            }
            else {
                break;
            }
        }
    }
    render(ctx) { }
}
class SimpleObject extends PhysicsObject {
    constructor(position, { width = 20 }) {
        super(position, width * 0.4);
        this.width = width;
    }
    update(game) {
        if (game.heldObject == this) {
            let newPosition = game.robotArm.end;
            this.velocity = newPosition.sub(this.position);
            this.position = newPosition;
        }
        else {
            this.position = this.position.add(this.velocity);
            this.velocity = this.velocity.mul(0.9);
        }
        super.update(game);
    }
    render(ctx) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#A45229";
        ctx.fillStyle = "#3B1F12";
        ctx.beginPath();
        ctx.moveTo(this.position.x - this.width / 2, this.position.y - this.width / 2);
        ctx.lineTo(this.position.x - this.width / 2, this.position.y + this.width / 2);
        ctx.lineTo(this.position.x + this.width / 2, this.position.y + this.width / 2);
        ctx.lineTo(this.position.x + this.width / 2, this.position.y - this.width / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    get handle() {
        let bound = this.width / 2 + 5;
        return new ConvexPolygonCollider([
            this.position.sub(new Vector(-bound, -bound)),
            this.position.sub(new Vector(-bound, bound)),
            this.position.sub(new Vector(bound, bound)),
            this.position.sub(new Vector(bound, -bound))
        ]);
    }
    adjustTarget(target) { return target; }
}
class SimpleAttractor {
    constructor(position, { radius = 20, speed = 1 }) {
        this.position = position;
        this.renderOrder = 100;
        this.radius = radius, this.speed = speed;
        this.heldObject = null;
    }
    update(game) {
        // Get closest SimpleObject within range
        this.heldObject = null;
        let objects = game.searchComponents(SimpleObject);
        if (objects.length > 0) {
            let targetObject = objects.reduce((a, b) => {
                return (b.position.sub(this.position).norm2 < a.position.sub(this.position).norm2)
                    ? b : a;
            });
            let offset = targetObject.position.sub(this.position);
            let t = offset.norm / this.radius;
            if (t < 1) {
                this.heldObject = targetObject;
                targetObject.velocity = targetObject.velocity.sub(offset.normalized().mul(this.radius * this.speed * FRAME_INTERVAL / 1000 * t));
            }
        }
    }
    render(ctx) { }
}
