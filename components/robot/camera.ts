class Camera implements IComponent {
    renderOrder: number = 0;
    position: Vector;
    velocity: Vector;
    stiffness: number;
    damping: number;
    constructor(public target: RobotArm | null, {stiffness = 9, damping = 1}) {
        if (this.target != null) {
            this.position = this.target.armature[0].start;
        } else {
            this.position = Vector.ZERO;
        }
        this.velocity = Vector.ZERO;
        this.stiffness = stiffness, this.damping = damping;
    }
    update(game: Game) {
        let targetPos = (this.target != null) ? this.target.armature[0].start : this.position;
        this.position = this.position.add(this.velocity.mul(FRAME_INTERVAL / 1000));
        let pullFactor = targetPos.sub(this.position).mul(this.stiffness);
        let dampingFactor = this.velocity.mul(-2 * this.damping * Math.sqrt(this.stiffness));
        this.velocity = this.velocity.add(pullFactor.add(dampingFactor).mul(FRAME_INTERVAL / 1000));
    }
    render(ctx: CanvasRenderingContext2D) { }
}