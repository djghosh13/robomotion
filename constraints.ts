interface Constraint {
    fixConstraint(base: Bone, tracking: Bone, angleDiff: number): number;
    render(ctx: CanvasRenderingContext2D): void;
}


function boneConstrain(bone: Bone, tracking: Bone, angleDiff: number, constraints: Constraint[]) {
    for (let constraint of constraints) {
        angleDiff = constraint.fixConstraint(bone, tracking, angleDiff);
    }
    return angleDiff;
}


class CircleConstraint implements Constraint {
    constructor(
            public center: Vector,
            public radius: number
        ) {}
    fixConstraint(base: Bone, tracking: Bone, angleDiff: number) {
        return this.boneEndConstraint(base, tracking, angleDiff);
    }
    render(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.center.x, this.center.y, this.radius, 0, TWO_PI);
        ctx.closePath();
        ctx.stroke();
    }
    boneEndConstraint(base: Bone, tracking: Bone, angleDiff: number) {
        let currentAngle = tracking.end.sub(base.start).angle;
        let centerAngle = this.center.sub(base.start).angle;
        let A = tracking.end.sub(base.start).norm;
        let B = this.center.sub(base.start).norm;
        let tangentDiff = Math.acos((A*A + B*B - this.radius*this.radius) / (2*A*B));
        if (!Number.isNaN(tangentDiff)) {
            let currentDiff = clipAngle((currentAngle + angleDiff) - centerAngle);
            if (angleDiff > 0 && currentDiff > 0 && currentDiff > tangentDiff) {
                angleDiff -= currentDiff - tangentDiff;
            }
            if (angleDiff < 0 && currentDiff < 0 && -currentDiff > tangentDiff) {
                angleDiff += (-currentDiff) - tangentDiff;
            }
        }
        return angleDiff;
    }
}
