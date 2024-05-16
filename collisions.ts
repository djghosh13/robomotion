interface Collider {
    fixCollision(bone: Bone, tracking: Bone, angleDiff: number): number;
    render(ctx: CanvasRenderingContext2D): void;
}

class CircleCollider implements Collider {
    constructor(
            public center: Vector,
            public radius: number
        ) {}
    fixCollision(base: Bone, tracking: Bone, angleDiff: number) {
        return this.boneTangentCollision(base, tracking, this.boneEndCollision(base, tracking, angleDiff));
    }
    render(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.arc(this.center.x, this.center.y, this.radius, 0, TWO_PI);
        ctx.closePath();
        ctx.stroke();
    }
    boneEndCollision(base: Bone, tracking: Bone, angleDiff: number) {
        let currentAngle = tracking.end.sub(base.start).angle;
        let centerAngle = this.center.sub(base.start).angle;
        let A = tracking.end.sub(base.start).norm;
        let B = this.center.sub(base.start).norm;
        let tangentDiff = Math.acos((A*A + B*B - this.radius*this.radius) / (2*A*B));
        if (!Number.isNaN(tangentDiff)) {
            let currentDiff = clipAngle(centerAngle - (currentAngle + angleDiff));
            if (angleDiff > 0 && currentDiff > 0 && currentDiff < tangentDiff) {
                angleDiff -= tangentDiff - currentDiff;
            }
            if (angleDiff < 0 && currentDiff < 0 && -currentDiff < tangentDiff) {
                angleDiff += tangentDiff - (-currentDiff);
            }
        }
        return angleDiff;
    }
    boneTangentCollision(base: Bone, tracking: Bone, angleDiff: number) {
        let tMin = tracking.start.sub(base.start).dot(tracking.end.sub(tracking.start).normalized());
        let tMax = tMin + tracking.length;
        let A = tracking.start.sub(base.start).cross(tracking.end.sub(tracking.start).normalized());
        let B = this.center.sub(base.start).norm;
        // Get potential solutions
        let solutions: number[] = [];
        for (let facing of [1, -1]) {
            let t = Math.sqrt(B*B - (A*facing - this.radius)*(A*facing - this.radius));
            if (!Number.isNaN(t)) {
                if (tMin < t && t < tMax) {
                    solutions.push(t);
                }
                if (tMin < -t && -t < tMax) {
                    solutions.push(-t);
                }
            }
        }
        // Solve for collision directions
        for (let t of solutions) {
            let trackedPoint = tracking.start.add(tracking.end.sub(tracking.start).mul((t - tMin) / (tMax - tMin)));
            let currentAngle = trackedPoint.sub(base.start).angle;
            let centerAngle = this.center.sub(base.start).angle;
            let A = trackedPoint.sub(base.start).norm;
            let B = this.center.sub(base.start).norm;
            let tangentDiff = Math.acos((A*A + B*B - this.radius*this.radius) / (2*A*B));
            if (!Number.isNaN(tangentDiff)) {
                let currentDiff = clipAngle(centerAngle - (currentAngle + angleDiff));
                if (angleDiff > 0 && currentDiff > 0 && currentDiff < tangentDiff) {
                    angleDiff -= tangentDiff - currentDiff;
                }
                if (angleDiff < 0 && currentDiff < 0 && -currentDiff < tangentDiff) {
                    angleDiff += tangentDiff - (-currentDiff);
                }
            }
        }
        return angleDiff;
    }
}

function boneCollide(bone: Bone, tracking: Bone, angleDiff: number, colliders: Collider[]) {
    for (let collider of colliders) {
        angleDiff = collider.fixCollision(bone, tracking, angleDiff);
    }
    return angleDiff;
}
