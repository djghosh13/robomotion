class Game {
    public ctx: CanvasRenderingContext2D;
    public armature: BoneGraphics[];
    public components: IComponent[];

    get robotArm() {
        return this.armature[this.armature.length - 1];
    }
    update() {
        // Get all colliders and constraints
        let anyColliders: Collider[] = [];
        let endColliders: Collider[] = [];
        let anyConstraints: Collider[] = [];
        let endConstraints: Collider[] = [];
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
        const MAX_ITER = 4;
        for (let i = 0; i < MAX_ITER; i++) {
            let moments = computeMoI(this.armature);
            for (let j = 0; j < this.armature.length; j++) {
                // Compute desired trajectory
                let desiredRotation = boneTrack(
                    this.armature[j], mouse, this.armature[this.armature.length - 1],
                    this.armature[j].rotationSpeed / moments[j] / MAX_ITER
                );
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
                let collision = getCollision(bone, constraints);
                if (collision != null) {
                    let boneAxis = bone.end.sub(bone.start).normalized();
                    let t = collision.origin.sub(bone.start).dot(boneAxis) / bone.length;
                    // Compute desired trajectory
                    for (let j = 0; j <= k; j++) {
                        let desiredFix = boneTrack(
                            this.armature[j], collision.origin.add(collision.offset), bone,
                            Number.POSITIVE_INFINITY, t
                        );
                        this.armature[j].angle += desiredFix;
                    }
                }
            }
        }
        // Update components
        for (let comp of this.components) {
            comp.update(this);
        }
    }
    render() {
        // Draw armature
        setup(this.ctx);
        for (let comp of this.components) {
            comp.render(this.ctx);
        }
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = "white";
        this.ctx.fillStyle = "#0009";
        for (let i = 0; i < this.armature.length; i++) {
            this.armature[i].render(this.ctx);
        }
    }
}