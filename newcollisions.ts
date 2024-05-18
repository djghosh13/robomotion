type BoneEndData = {
    offset: Vector;
};
type BoneEndCollision = {
    limit: number;
    direction: number;
};

interface NewCollider {
    boneEndCollisions(base: Bone, boneEnd: BoneEndData): BoneEndCollision[];
}


function getCollisions(base: Bone, tracking: Bone, colliders: NewCollider[]) {
    let collisions: BoneEndCollision[] = [];
    // Bone end
    let boneEnd: BoneEndData = {offset: tracking.end.sub(base.start)};
    for (let collider of colliders) {
        collisions.push(...collider.boneEndCollisions(base, boneEnd));
    }
    return collisions;
}

function adjustForCollisions(desiredRotation: number, collisions: BoneEndCollision[]) {
    let direction = Math.sign(desiredRotation);
    for (let collision of collisions) {
        if (collision.direction == direction &&
                ((direction > 0 && desiredRotation > collision.limit) ||
                (direction < 0 && desiredRotation < collision.limit))) {
            desiredRotation = collision.limit;
        }
    }
    return desiredRotation;
}

class NewCircleCollider implements NewCollider {
    constructor(public center: Vector, public radius: number) {}
    boneEndCollisions(base: Bone, boneEnd: BoneEndData) {
        let centerDistance = this.center.sub(base.start).norm;
        let angleBetween = Math.acos((centerDistance*centerDistance + boneEnd.offset.norm2 -
            this.radius*this.radius) / (2 * centerDistance * boneEnd.offset.norm));
        if (!Number.isNaN(angleBetween)) {
            let centerAngle = this.center.sub(base.start).angle;
            return [
                {limit: clipAngle(centerAngle - angleBetween - boneEnd.offset.angle), direction: 1},
                {limit: clipAngle(centerAngle + angleBetween - boneEnd.offset.angle), direction: -1}
            ];
        }
        return [];
    }
}

class NewHalfPlaneCollider implements NewCollider {
    constructor(public point: Vector, public normal: Vector) {}
    boneEndCollisions(base: Bone, boneEnd: BoneEndData) {
        let planeDistance = this.point.sub(base.start).dot(this.normal);
        let angleBetween = Math.acos(planeDistance / boneEnd.offset.norm);
        if (!Number.isNaN(angleBetween)) {
            let planeAngle = this.normal.angle;
            return [
                {limit: clipAngle(planeAngle - angleBetween - boneEnd.offset.angle), direction: -1},
                {limit: clipAngle(planeAngle + angleBetween - boneEnd.offset.angle), direction: 1}
            ];
        }
        return [];
    }
}