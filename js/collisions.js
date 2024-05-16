function boneCollide(bone, tracking, angleDiff, colliders) {
    for (let collider of colliders) {
        angleDiff = collider.fixCollision(bone, tracking, angleDiff);
    }
    return angleDiff;
}
class CircleCollider {
    constructor(center, radius) {
        this.center = center;
        this.radius = radius;
    }
    fixCollision(base, tracking, angleDiff) {
        return this.boneTangentCollision(base, tracking, this.boneEndCollision(base, tracking, angleDiff));
    }
    render(ctx) {
        ctx.beginPath();
        ctx.arc(this.center.x, this.center.y, this.radius, 0, TWO_PI);
        ctx.closePath();
        ctx.stroke();
    }
    boneEndCollision(base, tracking, angleDiff) {
        let currentAngle = tracking.end.sub(base.start).angle;
        let centerAngle = this.center.sub(base.start).angle;
        let A = tracking.end.sub(base.start).norm;
        let B = this.center.sub(base.start).norm;
        let tangentDiff = Math.acos((A * A + B * B - this.radius * this.radius) / (2 * A * B));
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
    boneTangentCollision(base, tracking, angleDiff) {
        let tMin = tracking.start.sub(base.start).dot(tracking.end.sub(tracking.start).normalized());
        let tMax = tMin + tracking.length;
        let A = tracking.start.sub(base.start).cross(tracking.end.sub(tracking.start).normalized());
        let B = this.center.sub(base.start).norm;
        // Get potential solutions
        let solutions = [];
        for (let facing of [1, -1]) {
            let t = Math.sqrt(B * B - (A * facing - this.radius) * (A * facing - this.radius));
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
            let tangentDiff = Math.acos((A * A + B * B - this.radius * this.radius) / (2 * A * B));
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
class HalfPlaneCollider {
    constructor(point, normal) {
        this.point = point;
        this.normal = normal;
    }
    fixCollision(base, tracking, angleDiff) {
        // Only the end of a bone can hit the half-plane
        return this.boneEndCollision(base, tracking, angleDiff);
    }
    render(ctx) {
        const EPSILON = 1e-6;
        let ndotp = this.normal.dot(this.point);
        let pointA = null;
        let pointB = null;
        if (Math.abs(this.normal.x) > EPSILON) {
            pointA = new Vector(ndotp / this.normal.x, 0);
            pointB = new Vector((ndotp - this.normal.y * ctx.canvas.height) / this.normal.x, ctx.canvas.height);
        }
        else if (Math.abs(this.normal.y) > EPSILON) {
            pointA = new Vector(0, ndotp / this.normal.y);
            pointB = new Vector(ctx.canvas.width, (ndotp - this.normal.x * ctx.canvas.width) / this.normal.y);
        }
        if (pointA != null && pointB != null) {
            ctx.beginPath();
            ctx.moveTo(pointA.x, pointA.y);
            ctx.lineTo(pointB.x, pointB.y);
            ctx.closePath();
            ctx.stroke();
        }
    }
    boneEndCollision(base, tracking, angleDiff) {
        let currentAngle = tracking.end.sub(base.start).angle;
        let planeAngle = clipAngle(this.normal.angle + Math.PI);
        let distanceToPlane = base.start.sub(this.point).dot(this.normal);
        let A = tracking.end.sub(base.start).norm;
        let contactDiff = Math.acos(distanceToPlane / A);
        if (!Number.isNaN(contactDiff)) {
            let currentDiff = clipAngle(planeAngle - (currentAngle + angleDiff));
            if (angleDiff > 0 && currentDiff > 0 && currentDiff < contactDiff) {
                angleDiff -= contactDiff - currentDiff;
            }
            if (angleDiff < 0 && currentDiff < 0 && -currentDiff < contactDiff) {
                angleDiff += contactDiff - (-currentDiff);
            }
        }
        return angleDiff;
    }
}
