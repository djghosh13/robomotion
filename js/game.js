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
        // Get all colliders
        let anyColliders = [];
        let endColliders = [];
        for (let comp of this.components) {
            if (iofICollidable(comp)) {
                let collider = comp.collider;
                if (collider.properties.layer == CollisionLayer.ANY_BONE) {
                    anyColliders.push(comp.collider);
                }
                endColliders.push(comp.collider);
            }
        }
        // Compute movements
        let desiredTarget = mousePosition;
        if (this.heldObject != null) {
            desiredTarget = this.heldObject.adjustTarget(desiredTarget);
        }
        const MAX_ITER = 4;
        let firstCollision = null;
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
        if (firstCollision != null && Math.random() < 0.1) {
            game.spawnObject(new Sparks(firstCollision.origin));
        }
        // Update components
        for (let comp of this.components) {
            comp.update(this);
        }
        mouseJustPressed = false;
    }
    render() {
        setup(this.ctx);
        let renderOrdering = [...this.components].sort((a, b) => a.renderOrder - b.renderOrder);
        let splitIndex = renderOrdering.reduce((splitIndex, comp, curIndex) => (comp.renderOrder < 0) ? curIndex + 1 : splitIndex, 0);
        // Draw background (negative renderOrder)
        for (let i = 0; i < splitIndex; i++) {
            if (renderOrdering[i] != this.heldObject) {
                renderOrdering[i].render(this.ctx);
            }
        }
        // Draw armature
        for (let i = 0; i < this.armature.length - 1; i++) {
            this.armature[i].render(this.ctx);
        }
        // Draw held object
        if (this.heldObject != null) {
            this.heldObject.render(this.ctx);
        }
        // Draw grabber arm
        this.armature[this.armature.length - 1].renderGrabber(this.ctx);
        // Draw foreground (positive renderOrder)
        for (let i = splitIndex; i < renderOrdering.length; i++) {
            if (renderOrdering[i] != this.heldObject) {
                renderOrdering[i].render(this.ctx);
            }
        }
    }
    oldRender() {
        setup(this.ctx);
        // Draw regular components in order
        for (let componentType of [WireLight, Carrier, Button, Lever, ChainPull, SimpleObstacle, Light, CounterLight]) {
            for (let comp of this.searchComponents(componentType)) {
                comp.render(this.ctx);
            }
        }
        // Draw unheld objects
        for (let comp of this.searchComponents(SimpleObject)) {
            if (comp != this.heldObject) {
                comp.render(this.ctx);
            }
        }
        // Draw armature
        for (let i = 0; i < this.armature.length - 1; i++) {
            this.armature[i].render(this.ctx);
        }
        // Draw held object
        if (this.heldObject != null && this.heldObject instanceof SimpleObject) {
            this.heldObject.render(this.ctx);
        }
        // Draw grabber arm
        this.armature[this.armature.length - 1].renderGrabber(this.ctx);
        // Draw glass containers
        for (let componentType of [FireworkSpawner, FireworkFiller, FireworkExplosion]) {
            for (let comp of this.searchComponents(componentType)) {
                comp.render(this.ctx);
            }
        }
    }
    searchComponents(cls) {
        return this.components.filter(function (x) {
            return x instanceof cls;
        });
    }
    spawnObject(object) {
        this.components.push(object);
    }
    destroyObject(object) {
        let index = this.components.indexOf(object);
        if (index != -1) {
            this.components.splice(index, 1);
            if (object == this.heldObject) {
                this.heldObject = null;
            }
        }
    }
}
