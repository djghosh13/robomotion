class Game {
    get robotArm() {
        return this.armature[this.armature.length - 1];
    }
    update() {
        // Get all colliders
        let colliders = [];
        for (let comp of this.components) {
            if (iofICollidable(comp)) {
                colliders.push(comp.collider);
            }
        }
        // Compute movements
        const MAX_ITER = 4;
        for (let i = 0; i < MAX_ITER; i++) {
            let moments = computeMoI(this.armature);
            for (let j = 0; j < this.armature.length; j++) {
                // Compute desired trajectory
                let desiredRotation = boneTrack(this.armature[j], mouse, this.armature[this.armature.length - 1], moments[j], this.armature[j].rotationSpeed / MAX_ITER);
                // Adjust for collisions
                for (let k = j; k < this.armature.length; k++) {
                    let collisions = getCollisions(this.armature[j], this.armature[k], colliders);
                    desiredRotation = adjustForCollisions(desiredRotation, collisions);
                }
                this.armature[j].angle += desiredRotation;
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
