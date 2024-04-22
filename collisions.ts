// type CollisionInfo = {
//     point: Vector;
//     normal: Vector;
// };

interface Collider {
    fixCollision(bone: Bone): boolean;
    render(ctx: CanvasRenderingContext2D): void;
}

class CircleCollider implements Collider {
    constructor(
            public center: Vector,
            public radius: number
        ) {}
    fixCollision(bone: Bone) {
        // Tangent collision
        let trueT = Math.sqrt(this.center.sub(bone.start).norm2 - this.radius*this.radius) / bone.length;
        let collisionT = Math.min(trueT, 1);
        // let point = bone.start.add(bone.end.sub(bone.start).mul(collisionT));
        let d = this.center.sub(bone.start);
        let l = bone.end.sub(bone.start).mul(collisionT);
        let minAngle = Math.acos(
            (d.norm2 + l.norm2 - this.radius*this.radius) /
            (2 * d.norm * l.norm)
        );
        let curAngle = clipAngle(bone.end.sub(bone.start).angle - this.center.sub(bone.start).angle);
        if (Math.abs(curAngle) < minAngle) {
            // console.log("Collide!", minAngle, curAngle);
            let diff = minAngle * Math.sign(curAngle) - curAngle;
            bone.angle += diff;
            return true;
        }
        return false;
    }
    render(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.arc(this.center.x, this.center.y, this.radius, 0, TWO_PI);
        ctx.closePath();
        ctx.stroke();
    }
}

function collideArm(armature: Bone[], colliders: Collider[]) {
    for (let i = 0; i < armature.length; i++) {
        for (let collider of colliders) {
            collider.fixCollision(armature[i]);
        }
    }
}