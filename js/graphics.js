class BoneGraphics extends BonePhysics {
    constructor(offset, parent, speed, width) {
        super(offset, parent, speed);
        this.lineWidth = width;
    }
    render(ctx) {
        let ortho = this.end.sub(this.start).rotate(Math.PI / 2).normalized();
        let startLeft = this.start.add(ortho.mul(this.lineWidth));
        let startRight = this.start.sub(ortho.mul(this.lineWidth));
        let endLeft = this.end.add(ortho.mul(this.lineWidth / 2));
        let endRight = this.end.sub(ortho.mul(this.lineWidth / 2));
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.moveTo(startLeft.x, startLeft.y);
        ctx.lineTo(endLeft.x, endLeft.y);
        ctx.lineTo(endRight.x, endRight.y);
        ctx.lineTo(startRight.x, startRight.y);
        ctx.closePath();
        ctx.stroke();
    }
}
function buildArmGraphics(params) {
    let bones = [];
    // Root node
    let rootNode;
    if (params.root instanceof Root) {
        rootNode = params.root;
    }
    else if (params.root instanceof Vector) {
        rootNode = new Root(params.root);
    }
    else {
        rootNode = new Root(new Vector(params.root[0], params.root[1]));
    }
    // Bones
    for (let i = 0; i < params.bones.length; i++) {
        bones.push(new BoneGraphics(params.bones[i].length, (i == 0) ? rootNode : bones[i - 1], params.bones[i].speed || TWO_PI, params.bones[i].width));
    }
    return bones;
}
