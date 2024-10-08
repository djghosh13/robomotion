class BoneGraphics extends BonePhysics {
    width: number;

    constructor(offset: Vector | number, parent: Bone, speed: number, width: number) {
        super(offset, parent, speed);
        this.width = width;
    }
    render(ctx: CanvasRenderingContext2D) {
        const N_POINTS = 3;
        let ortho = this.end.sub(this.start).rotate90().normalized().mul(this.width / 2);
        let points: Vector[] = [];
        for (let i = 0; i <= N_POINTS; i++) {
            points.push(this.start.add(ortho.rotate(Math.PI * i / N_POINTS)));
        }
        for (let i = 0; i <= N_POINTS; i++) {
            points.push(this.end.add(ortho.rotate(Math.PI * i / N_POINTS).mul(-0.8)));
        }
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#ccc";
        ctx.fillStyle = "#111";
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.arc(this.start.x, this.start.y, this.width / 4, 0, TWO_PI);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    renderGrabber(ctx: CanvasRenderingContext2D, isGrabbing: boolean) {
        const N_POINTS = 3;
        let along = this.end.sub(this.start);
        let ortho = along.rotate90().normalized().mul(this.width / 2);
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#ccc";
        ctx.fillStyle = "#111";
        let angle = isGrabbing ? 0.2 : 0.35;
        for (let dir of [-1, 1]) {
            let points: Vector[] = [];
            for (let i = 0; i <= N_POINTS; i++) {
                points.push(ortho.mul(dir).rotate(dir * Math.PI * i / N_POINTS));
            }
            points.push(
                along.mul(0.5),
                along,
                along.mul(0.5).add(ortho.mul(dir)),
            );
            points = points.map(offset => offset.rotate(dir * angle));
            ctx.beginPath();
            ctx.moveTo(this.start.x + points[0].x, this.start.y + points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(this.start.x + points[i].x, this.start.y + points[i].y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.arc(this.start.x, this.start.y, this.width / 4, 0, TWO_PI);
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
