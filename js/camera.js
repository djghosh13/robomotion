class Camera {
    constructor(target, { speed = 100 }) {
        this.target = target;
        this.renderOrder = 0;
        if (this.target != null) {
            this.position = this.target.armature[0].start;
        }
        else {
            this.position = Vector.ZERO;
        }
        this.speed = speed;
    }
    update(game) {
        if (this.target != null) {
            let offset = this.target.armature[0].start.sub(this.position);
            if (offset.norm < this.speed * FRAME_INTERVAL / 1000) {
                this.position = this.position.add(offset);
            }
            else {
                this.position = this.position.add(offset.normalized().mul(this.speed * FRAME_INTERVAL / 1000));
            }
        }
    }
    render(ctx) { }
}
