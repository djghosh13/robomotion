function boneConstrain(bone, tracking, angleDiff, constraints) {
    for (let constraint of constraints) {
        angleDiff = constraint.fixConstraint(bone, tracking, angleDiff);
    }
    return angleDiff;
}
class CircleConstraint {
    constructor(center, radius) {
        this.center = center;
        this.radius = radius;
    }
    fixConstraint(base, tracking, angleDiff) {
        return this.boneEndConstraint(base, tracking, angleDiff);
    }
    render(ctx) {
        ctx.beginPath();
        ctx.arc(this.center.x, this.center.y, this.radius, 0, TWO_PI);
        ctx.closePath();
        ctx.stroke();
    }
    boneEndConstraint(base, tracking, angleDiff) {
        let currentAngle = tracking.end.sub(base.start).angle;
        let centerAngle = this.center.sub(base.start).angle;
        let A = tracking.end.sub(base.start).norm;
        let B = this.center.sub(base.start).norm;
        let tangentDiff = Math.acos((A * A + B * B - this.radius * this.radius) / (2 * A * B));
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
