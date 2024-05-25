class BoneGraphics extends BonePhysics {
    lineWidth: number;

    constructor(offset: Vector | number, parent: Bone, speed: number, width: number) {
        super(offset, parent, speed);
        this.lineWidth = width;
    }
    render(ctx: CanvasRenderingContext2D) {
        let ortho = this.end.sub(this.start).rotate90().normalized();
        let startLeft = this.start.add(ortho.mul(this.lineWidth));
        let startRight = this.start.sub(ortho.mul(this.lineWidth));
        let endLeft = this.end.add(ortho.mul(this.lineWidth / 2));
        let endRight = this.end.sub(ortho.mul(this.lineWidth / 2));
        ctx.beginPath();
        ctx.moveTo(startLeft.x, startLeft.y);
        ctx.lineTo(endLeft.x, endLeft.y);
        ctx.lineTo(endRight.x, endRight.y);
        ctx.lineTo(startRight.x, startRight.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
}


type BoneGraphicsParameters = BoneParameters & {
    width: number;
};
type ArmGraphicsParameters = ArmParameters & {
    bones: BoneGraphicsParameters[];
}

function buildArmGraphics(params: ArmGraphicsParameters) {
    let bones: BoneGraphics[] = [];
    // Root node
    let rootNode: Root;
    if (params.root instanceof Root) {
        rootNode = params.root;
    } else if (params.root instanceof Vector) {
        rootNode = new Root(params.root);
    } else {
        rootNode = new Root(new Vector(params.root[0], params.root[1]));
    }
    // Bones
    for (let i = 0; i < params.bones.length; i++) {
        bones.push(new BoneGraphics(
            params.bones[i].length,
            (i == 0) ? rootNode : bones[i - 1],
            params.bones[i].speed || TWO_PI,
            params.bones[i].width
        ));
    }
    return bones;
}
