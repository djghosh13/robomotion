type Collision = {
    origin: Vector;
    offset: Vector;
};

enum CollisionLayer {
    ANY_BONE,
    END_BONE
};
type ColliderProperties = {
    layer?: CollisionLayer;
    constraint?: boolean;
};

abstract class Collider {
    properties: ColliderProperties;
    constructor(props: ColliderProperties) {
        this.properties = {
            layer: CollisionLayer.ANY_BONE,
            constraint: false,
            ...props
        };
    }
    abstract getCollision(bone: Bone): Collision | null;
    abstract getObjectCollision(object: CircleCollider): Collision | null;
    abstract render(ctx: CanvasRenderingContext2D): void;
}


function getCollision(bone: Bone, colliders: Collider[]) {
    // Simple collision check
    for (let collider of colliders) {
        let collision = collider.getCollision(bone);
        if (collision != null) {
            return collision;
        }
    }
    return null;
}

function getObjectCollision(object: CircleCollider, colliders: Collider[]) {
    // Simple circle collision check
    for (let collider of colliders) {
        let collision = collider.getObjectCollision(object);
        if (collision != null) {
            return collision;
        }
    }
    return null;
}


class NullCollider extends Collider {
    constructor() {
        super({ });
    }
    getCollision(bone: Bone) { return null; }
    getObjectCollision(object: CircleCollider) { return null; }
    render(ctx: CanvasRenderingContext2D) { }
}


class CircleCollider extends Collider {
    constructor(public center: Vector, public radius: number, props?: ColliderProperties) {
        super(props || {});
    }
    getCollision(bone: Bone) {
        const EPSILON = 1e-6;
        // Farthest in point is either end or point along line closest to the center
        let closestPoint: Vector;
        let boneAxis = bone.end.sub(bone.start).normalized();
        {
            let tMin = bone.start.dot(boneAxis);
            let tMax = bone.end.dot(boneAxis);
            let t = Math.min(Math.max(this.center.dot(boneAxis), tMin), tMax);
            closestPoint = bone.start.add(boneAxis.mul(t - tMin));
        }
        let distance = closestPoint.sub(this.center).norm;
        if (distance < EPSILON) {
            // No singular direction, return orthogonal to bone
            return {
                origin: closestPoint,
                offset: boneAxis.rotate90().mul(this.radius)
            };
        }
        if (distance < this.radius) {
            // Move outwards by radius - distance
            return {
                origin: closestPoint,
                offset: closestPoint.sub(this.center).mul((this.radius - distance) / distance)
            };
        }
        return null;
    }
    getObjectCollision(object: CircleCollider) {
        const EPSILON = 1e-6;
        let disp = object.center.sub(this.center);
        let distance = disp.norm;
        if (distance < EPSILON) {
            // Concentric circles, choose arbitrary direction
            return {
                origin: object.center,
                offset: new Vector(this.radius, 0)
            };
        }
        if (distance < this.radius + object.radius) {
            return {
                origin: object.center.sub(disp.mul(object.radius / distance)),
                offset: disp.mul((this.radius + object.radius - distance) / distance)
            };
        }
        return null;
    }
    render(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.center.x, this.center.y, this.radius, 0, TWO_PI);
        ctx.closePath();
        ctx.stroke();
    }
}


class HalfPlaneCollider extends Collider {
    constructor(public point: Vector, public normal: Vector, props?: ColliderProperties) {
        super(props || {});
    }
    getCollision(bone: Bone) {
        let closestPoint = bone.end.sub(bone.start).dot(this.normal) > 0 ? bone.start : bone.end;
        let distance = closestPoint.sub(this.point).dot(this.normal);
        if (distance < 0) {
            return {
                origin: closestPoint,
                offset: this.normal.mul(-distance)
            };
        }
        return null;
    }
    getObjectCollision(object: CircleCollider) {
        let distance = object.center.sub(this.point).dot(this.normal);
        if (distance < object.radius) {
            return {
                origin: object.center.sub(this.normal.mul(object.radius)),
                offset: this.normal.mul(object.radius - distance)
            };
        }
        return null;
    }
    render(ctx: CanvasRenderingContext2D) {
        const EPSILON = 1e-6;
        let ndotp = this.normal.dot(this.point);
        let pointA: Vector | null = null;
        let pointB: Vector | null = null;
        if (Math.abs(this.normal.x) > EPSILON) {
            pointA = new Vector(ndotp / this.normal.x, 0);
            pointB = new Vector((ndotp - this.normal.y * ctx.canvas.height) / this.normal.x, ctx.canvas.height);
        } else if (Math.abs(this.normal.y) > EPSILON) {
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


class ConvexPolygonCollider extends Collider {
    normals: Vector[];

    constructor(public points: Vector[], props?: ColliderProperties) {
        super(props || {});
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
    getCollision(bone: Bone) {
        // Get endpoint (normal to polygon side) fixes
        let startCollision = this.getEndpointCollision(bone.start, bone.end.sub(bone.start));
        let endCollision = this.getEndpointCollision(bone.end, bone.start.sub(bone.end));
        // Get side (normal to bone) fix
        let sideCollision = this.getSideCollision(bone);
        // Return direction with least distance
        let bestDistance = Number.POSITIVE_INFINITY;
        let bestCollision: Collision | null = null;
        for (let collision of [startCollision, endCollision, sideCollision]) {
            if (collision != null && collision.offset.norm < bestDistance) {
                bestDistance = collision.offset.norm;
                bestCollision = collision;
            }
        }
        return bestCollision;
    }
    getObjectCollision(object: CircleCollider) {
        // Intersection of half-plane collisions
        let nearestDistance = Number.POSITIVE_INFINITY;
        let nearestCollision: Collision | null = null;
        for (let i = 0; i < this.N; i++) {
            let halfPlaneCollider = new HalfPlaneCollider(this.points[i], this.normals[i]);
            let collision = halfPlaneCollider.getObjectCollision(object);
            if (collision != null) {
                let distance = collision.offset.norm2;
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestCollision = collision;
                }
            } else {
                return null;
            }
        }
        return nearestCollision;
    }
    render(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.moveTo(this.points[this.N - 1].x, this.points[this.N - 1].y);
        for (let i = 0; i < this.N; i++) {
            ctx.lineTo(this.points[i].x, this.points[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    private getEndpointCollision(point: Vector, direction: Vector): Collision | null {
        let bestDistance = Number.POSITIVE_INFINITY;
        let bestDirection: Vector | null = null;
        for (let i = 0; i < this.N; i++) {
            let dist = point.sub(this.points[i]).dot(this.normals[i]);
            if (dist >= 0) {
                // Not in polygon
                return null;
            }
            if (direction.dot(this.normals[i]) >= 0) {
                // Assumes direction points along the rest of the bone
                if (-dist < bestDistance) {
                    bestDistance = -dist;
                    bestDirection = this.normals[i].mul(bestDistance);
                }
            }
        }
        if (bestDirection != null) {
            return {
                origin: point,
                offset: bestDirection
            };
        }
        return null;
    }
    private getSideCollision(bone: Bone): Collision | null {
        let boneAxis = bone.end.sub(bone.start).normalized();
        let boneNormal = boneAxis.rotate90();
        let tMin = bone.start.dot(boneAxis);
        let tMax = bone.end.dot(boneAxis);
        let farthestNegativeDistance = 0;
        let farthestNegativePoint: Vector | null = null;
        let farthestPositiveDistance = 0;
        let farthestPositivePoint: Vector | null = null;
        let seenNegativeMin = false, seenNegativeMax = false,
            seenPositiveMin = false, seenPositiveMax = false;
        for (let i = 0; i < this.N; i++) {
            let t = this.points[i].dot(boneAxis);
            let dist = this.points[i].sub(bone.start).dot(boneNormal);
            if (dist < 0) {
                seenNegativeMin ||= tMin < t;
                seenNegativeMax ||= t < tMax;
                if (tMin < t && t < tMax) {
                    if (Math.abs(dist) > farthestNegativeDistance) {
                        farthestNegativeDistance = Math.abs(dist);
                        farthestNegativePoint = this.points[i];
                    }
                }
            } else if (dist > 0) {
                seenPositiveMin ||= tMin < t;
                seenPositiveMax ||= t < tMax;
                if (tMin < t && t < tMax) {
                    if (Math.abs(dist) > farthestPositiveDistance) {
                        farthestPositiveDistance = Math.abs(dist);
                        farthestPositivePoint = this.points[i];
                    }
                }
            }
        }
        if (seenNegativeMin && seenNegativeMax && seenPositiveMin && seenPositiveMax) {
            // Discount farther away possibility
            if (farthestNegativeDistance < farthestPositiveDistance) {
                farthestPositivePoint = null;
            } else {
                farthestNegativePoint = null;
            }
            // Move towards closer point
            if (farthestNegativePoint != null) {
                return {
                    origin: bone.start.add(boneAxis.mul(farthestNegativePoint.sub(bone.start).dot(boneAxis))),
                    offset: boneNormal.mul(farthestNegativePoint.sub(bone.start).dot(boneNormal))
                };
            } else if (farthestPositivePoint != null) {
                return {
                    origin: bone.start.add(boneAxis.mul(farthestPositivePoint.sub(bone.start).dot(boneAxis))),
                    offset: boneNormal.mul(farthestPositivePoint.sub(bone.start).dot(boneNormal))
                };
            }
        }
        return null;
    }
}
