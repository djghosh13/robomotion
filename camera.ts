class Camera implements IComponent {
    renderOrder: number = 0;
    position: Vector;
    speed: number;
    constructor(public target: RobotArm | null, {speed = 100}) {
        if (this.target != null) {
            this.position = this.target.armature[0].start;
        } else {
            this.position = Vector.ZERO;
        }
        this.speed = speed;
    }
    update(game: Game) {
        if (this.target != null) {
            let offset = this.target.armature[0].start.sub(this.position);
            if (offset.norm < this.speed * FRAME_INTERVAL / 1000) {
                this.position = this.position.add(offset);
            } else {
                this.position = this.position.add(offset.normalized().mul(this.speed * FRAME_INTERVAL / 1000));
            }
        }
    }
    render(ctx: CanvasRenderingContext2D) { }
}