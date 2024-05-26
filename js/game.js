class Game {
    constructor() {
        this.heldObject = null;
    }
    get robotArm() {
        return this.armature[this.armature.length - 1];
    }
    update() {
        // Grab or release objects
        if (!isMousePressed) {
            this.heldObject = null;
        }
        else if (mouseJustPressed) {
            for (let comp of this.components) {
                if (iofIGrabbable(comp)) {
                    let collider = comp.handle;
                    if (collider.getCollision(this.robotArm) != null) {
                        this.heldObject = comp;
                        break;
                    }
                }
            }
        }
        else if (this.heldObject != null) {
            // Check if still within holding bounds
            let collider = this.heldObject.handle;
            if (collider.getCollision(this.robotArm) == null) {
                this.heldObject = null;
            }
        }
        // Get all colliders and constraints
        let anyColliders = [];
        let endColliders = [];
        let anyConstraints = [];
        let endConstraints = [];
        for (let comp of this.components) {
            if (iofICollidable(comp)) {
                let collider = comp.collider;
                if (!collider.properties.constraint) {
                    if (collider.properties.layer == CollisionLayer.ANY_BONE) {
                        anyColliders.push(comp.collider);
                    }
                    endColliders.push(comp.collider);
                }
                if (collider.properties.layer == CollisionLayer.ANY_BONE) {
                    anyConstraints.push(comp.collider);
                }
                endConstraints.push(comp.collider);
            }
        }
        // Compute movements
        let desiredTarget = mousePosition;
        if (this.heldObject != null) {
            desiredTarget = this.heldObject.adjustTarget(desiredTarget);
        }
        const MAX_ITER = 4;
        for (let i = 0; i < MAX_ITER; i++) {
            let moments = computeMoI(this.armature);
            for (let j = 0; j < this.armature.length; j++) {
                // Compute desired trajectory
                let desiredRotation = boneTrack(this.armature[j], desiredTarget, this.armature[this.armature.length - 1], this.armature[j].rotationSpeed / moments[j] * FRAME_INTERVAL / 1000 / MAX_ITER);
                this.armature[j].angle += desiredRotation;
                // Prevent collisions
                const MAX_FIXES = 4;
                let fixes = 0;
                collisionCheck: for (let k = j; k < this.armature.length; k++) {
                    let colliders = (k == this.armature.length - 1) ? endColliders : anyColliders;
                    while (getCollision(this.armature[k], colliders) != null) {
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
                let constraints = (k == this.armature.length - 1) ? endConstraints : anyConstraints;
                for (let iter = 0; iter < MAX_ITER; iter++) {
                    let collision = getCollision(bone, constraints);
                    if (collision != null) {
                        let boneAxis = bone.end.sub(bone.start).normalized();
                        let t = collision.origin.sub(bone.start).dot(boneAxis) / bone.length;
                        // Compute desired trajectory
                        for (let j = 0; j <= k; j++) {
                            let desiredFix = boneTrack(this.armature[j], collision.origin.add(collision.offset), bone, Math.PI * FRAME_INTERVAL / 1000 / MAX_ITER, t);
                            this.armature[j].angle += desiredFix;
                        }
                    }
                    else {
                        break;
                    }
                }
            }
        }
        // Update components
        for (let comp of this.components) {
            comp.update(this);
        }
        mouseJustPressed = false;
    }
    render() {
        setup(this.ctx);
        for (let comp of this.components) {
            comp.render(this.ctx);
        }
        // Draw armature
        for (let i = 0; i < this.armature.length; i++) {
            if (i == this.armature.length - 1) {
                this.armature[i].renderGrabber(this.ctx);
            }
            else {
                this.armature[i].render(this.ctx);
            }
        }
    }
    searchComponents(cls) {
        return this.components.filter(function (x) {
            return x instanceof cls;
        });
    }
}
