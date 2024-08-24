interface Controller extends IComponent {
    isGrabbing(): boolean;
    justGrabbed(): boolean;
    getTarget(): Vector;
}

class MouseController implements Controller {
    renderOrder: number = 0;
    static readonly instance: MouseController = new MouseController();
    private targetPosition: Vector = Vector.ZERO;
    isGrabbing() {
        return isMousePressed;
    }
    justGrabbed() {
        return mouseJustPressed;
    }
    getTarget() {
        return this.targetPosition;
    }
    update(game: Game) {
        let camera = game.getCamera();
        if (camera != null) {
            let offset = SCREEN_SIZE.div(2).sub(camera.position);
            this.targetPosition = mousePosition.sub(offset);
        } else {
            this.targetPosition = mousePosition;
        }
    }
    render(ctx: CanvasRenderingContext2D) { }
}


class RobotArm implements IComponent {
    renderOrder: number = 0;
    heldObject: IComponent & IGrabbable | null;
    constructor(public armature: BoneGraphics[], public controller: Controller | null = null) {
        this.heldObject = null;
    }
    get grabber() {
        return this.armature[this.armature.length - 1];
    }
    update(game: Game) {
        // Grab or release objects
        if (this.controller == null || !this.controller.isGrabbing()) {
            this.heldObject = null;
        } else if (this.controller.justGrabbed()) {
            for (let comp of game.components) {
                if (iofIGrabbable(comp)) {
                    let collider = comp.handle;
                    if (collider.getCollision(this.grabber) != null) {
                        this.heldObject = comp;
                        break;
                    }
                }
            }
        } else if (this.heldObject != null) {
            // Check if still within holding bounds
            let collider = this.heldObject.handle;
            if (collider.getCollision(this.grabber) == null) {
                this.heldObject = null;
            }
        }
        // Get all colliders
        let anyColliders: Collider[] = [];
        let endColliders: Collider[] = [];
        for (let comp of game.components) {
            if (iofICollidable(comp)) {
                let collider = comp.collider;
                if (collider.properties.layer == CollisionLayer.ANY_BONE) {
                    anyColliders.push(comp.collider);
                }
                endColliders.push(comp.collider);
            }
        }
        // Compute movements
        let desiredTarget = (this.controller != null) ? this.controller.getTarget() : this.grabber.end;
        if (this.heldObject != null) {
            desiredTarget = this.heldObject.adjustTarget(desiredTarget);
        }
        const MAX_ITER = 4;
        let firstCollision: Collision | null = null;
        for (let i = 0; i < MAX_ITER; i++) {
            let moments = computeMoI(this.armature);
            for (let j = 0; j < this.armature.length; j++) {
                // Compute desired trajectory
                let desiredRotation = boneTrack(
                    this.armature[j], desiredTarget, this.armature[this.armature.length - 1],
                    this.armature[j].rotationSpeed / moments[j] * FRAME_INTERVAL / 1000 / MAX_ITER
                );
                this.armature[j].angle += desiredRotation;
                // Prevent collisions
                const MAX_FIXES = 4;
                let fixes = 0;
                collisionCheck: for (let k = j; k < this.armature.length; k++) {
                    let colliders = (k == this.armature.length - 1) ? endColliders : anyColliders;
                    while (getCollision(this.armature[k], colliders) != null) {
                        if (firstCollision == null) {
                            firstCollision = getCollision(this.armature[k], colliders);
                        }
                        fixes++;
                        desiredRotation /= 2;
                        this.armature[j].angle -= desiredRotation;
                        if (fixes > MAX_FIXES) {
                            this.armature[j].angle -= desiredRotation;
                            break collisionCheck;
                        }
                    }
                }
            }
            // Fix existing collisions
            for (let k = 0; k < this.armature.length; k++) {
                let bone = this.armature[k];
                let constraints = (k == this.armature.length - 1) ? endColliders : anyColliders;
                for (let iter = 0; iter < MAX_ITER; iter++) {
                    let collision = getCollision(bone, constraints);
                    if (collision != null) {
                        let boneAxis = bone.end.sub(bone.start).normalized();
                        let t = collision.origin.sub(bone.start).dot(boneAxis) / bone.length;
                        // Compute desired trajectory
                        for (let j = 0; j <= k; j++) {
                            let desiredFix = boneTrack(
                                this.armature[j], collision.origin.add(collision.offset), bone,
                                Math.PI * FRAME_INTERVAL / 1000 / MAX_ITER, t
                            );
                            this.armature[j].angle += desiredFix;
                        }
                    } else {
                        break;
                    }
                }
            }
        }
        if (firstCollision != null && Math.random() < 0.1) {
            game.spawnObject(new Sparks(firstCollision.origin));
        }
    }
    render(ctx: CanvasRenderingContext2D) {
        // Draw armature except for grabbing end
        for (let i = 0; i < this.armature.length - 1; i++) {
            this.armature[i].render(ctx);
        }
    }
}