function getCollisions(base, tracking, colliders) {
    let collisions = [];
    // Bone end
    let boneEnd = { offset: tracking.end.sub(base.start) };
    for (let collider of colliders) {
        collisions.push(...collider.boneEndCollisions(base, boneEnd));
    }
    return collisions;
}
function angleInRange(angle, start, end) {
    const EPSILON = 1e-6;
    if (Math.abs(clipAngle(end - start)) < EPSILON) {
        return null;
    }
    if (start < end) {
        if (start < angle && angle < end) {
            return (angle - start) / Math.max(end - start, EPSILON);
        }
        return null;
    }
    else if (start < angle) {
        return (angle - start) / Math.max(end - start + TWO_PI, EPSILON);
    }
    else if (angle < end) {
        return (angle - start + TWO_PI) / Math.max(end - start + TWO_PI, EPSILON);
    }
    return null;
}
function adjustForCollisions(desiredRotation, collisions) {
    let direction = Math.sign(desiredRotation);
    for (let collision of collisions) {
        let t = angleInRange(desiredRotation, collision.start, collision.end);
        if (t != null) {
            if (direction > 0 && t < 0.5) {
                desiredRotation = collision.start;
            }
            if (direction < 0 && t > 0.5) {
                desiredRotation = collision.end;
            }
        }
    }
    return desiredRotation;
}
class CircleCollider {
    constructor(center, radius) {
        this.center = center;
        this.radius = radius;
    }
    boneEndCollisions(base, boneEnd) {
        let centerDistance = this.center.sub(base.start).norm;
        let angleBetween = Math.acos((centerDistance * centerDistance + boneEnd.offset.norm2 -
            this.radius * this.radius) / (2 * centerDistance * boneEnd.offset.norm));
        if (!Number.isNaN(angleBetween)) {
            let centerAngle = this.center.sub(base.start).angle;
            return [
                {
                    start: clipAngle(centerAngle - angleBetween - boneEnd.offset.angle),
                    end: clipAngle(centerAngle + angleBetween - boneEnd.offset.angle)
                }
            ];
        }
        return [];
    }
    render(ctx) {
        ctx.beginPath();
        ctx.arc(this.center.x, this.center.y, this.radius, 0, TWO_PI);
        ctx.closePath();
        ctx.stroke();
    }
}
class HalfPlaneCollider {
    constructor(point, normal) {
        this.point = point;
        this.normal = normal;
    }
    boneEndCollisions(base, boneEnd) {
        let planeDistance = this.point.sub(base.start).dot(this.normal);
        let angleBetween = Math.acos(planeDistance / boneEnd.offset.norm);
        if (!Number.isNaN(angleBetween)) {
            let planeAngle = this.normal.angle;
            return [
                {
                    start: clipAngle(planeAngle + angleBetween - boneEnd.offset.angle),
                    end: clipAngle(planeAngle - angleBetween - boneEnd.offset.angle)
                }
            ];
        }
        if (planeDistance > 0) {
            return [
                { start: 0, end: 0, always: true }
            ];
        }
        return [];
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
}
class ConvexPolygonCollider {
    constructor(points) {
        this.points = points;
        this.normals = [];
        for (let i = 0; i < points.length; i++) {
            let normal = this.points[(i + 1) % this.N].sub(this.points[i]).rotate90().normalized();
            if (normal.dot(this.points[(i + 2) % this.N].sub(this.points[(i + 1) % this.N])) > 0) {
                normal = normal.mul(-1);
            }
            this.normals.push(normal);
        }
    }
    get N() { return this.points.length; }
    boneEndCollisions(base, boneEnd) {
        let halfPlaneCollisions = [];
        for (let i = 0; i < this.N; i++) {
            let halfPlaneSubCollider = new HalfPlaneCollider(this.points[i], this.normals[i]);
            let subCollisions = halfPlaneSubCollider.boneEndCollisions(base, boneEnd);
            if (subCollisions.length == 0) {
                return [];
            }
            if (i == 0) {
                halfPlaneCollisions = subCollisions;
            }
            else {
                let joined = [];
                for (let collision of halfPlaneCollisions) {
                    joined.push(...ConvexPolygonCollider.joinCollisions(collision, subCollisions[0]));
                }
                halfPlaneCollisions = joined;
            }
        }
        return halfPlaneCollisions;
    }
    render(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.points[this.N - 1].x, this.points[this.N - 1].y);
        for (let i = 0; i < this.N; i++) {
            ctx.lineTo(this.points[i].x, this.points[i].y);
        }
        ctx.closePath();
        ctx.stroke();
    }
    static joinCollisions(a, b) {
        if (a.always) {
            return [b];
        }
        if (b.always) {
            return [a];
        }
        // Reduce to 3 cases: ab normal, a normal b split, ab split
        if (b.start < b.end) {
            [a, b] = [b, a];
        }
        if (a.start < a.end) {
            if (b.start < b.end) {
                // Case 1: ab normal
                let joinStart = Math.max(a.start, b.start);
                let joinEnd = Math.min(a.end, b.end);
                if (joinStart < joinEnd) {
                    return [
                        { start: joinStart, end: joinEnd }
                    ];
                }
                return [];
            }
            // Case 2: a normal b split
            if (a.start < b.start && a.end > b.end) {
                let joins = [];
                if (a.start < b.end) {
                    joins.push({ start: a.start, end: b.end });
                }
                if (a.end > b.start) {
                    joins.push({ start: b.start, end: a.end });
                }
                return joins;
            }
            return [a];
        }
        // Case 3: ab split
        let joins = [
            { start: Math.max(a.start, b.start), end: Math.min(a.end, b.end) }
        ];
        if (a.start < b.end) {
            joins.push({ start: a.start, end: b.end });
        }
        if (b.start < a.end) {
            joins.push({ start: b.start, end: a.end });
        }
        return joins;
    }
}
