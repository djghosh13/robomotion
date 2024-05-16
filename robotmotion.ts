function computeMoI(armature: Bone[]) {
    // Compute moment of inertia
    let moments: number[] = [];
    let totalWeight = 0;
    for (let i = armature.length - 1; i >= 0; i--) {
        let rootPoint = armature[i].start;
        let rotationalWeight = 0;
        for (let j = i; j < armature.length; j++) {
            // 5-sample estimate of moment
            const samplePoints = [0.1, 0.3, 0.5, 0.7, 0.9];
            let moment = lerpVector(
                armature[j].start,
                armature[j].end,
                samplePoints
            ).map(
                midpoint => midpoint.sub(rootPoint).norm
            ).reduce((a, x) => a + x) / samplePoints.length * armature[j].length;
            rotationalWeight += moment;
        }
        totalWeight += armature[i].length;
        moments.unshift(rotationalWeight / totalWeight / totalWeight * 2);
    }
    return moments;
}

function boneTrack(bone: Bone, target: Vector, tracking: Bone, moment: number, rotationSpeed: number) {
    // Track
    let diff = clipAngle(
        target.sub(bone.start).angle - tracking.end.sub(bone.start).angle
    );
    let maxDiff = rotationSpeed / moment;
    diff = (diff > maxDiff) ? maxDiff : (diff < -maxDiff) ? -maxDiff : diff;
    return clipAngle(diff);
}

function lerpVector(start: Vector, end: Vector, value: number[]) {
    return value.map(v => start.mul(1 - v).add(end.mul(v)));
}

// function bonePull(bone: Bone, target: Vector, tracking: Bone, moment: number, rotationSpeed: number, pullForce: Vector | null) {
//     const FRICTION = 0.5;
//     if (pullForce == null) {
//         pullForce = target.sub(armature[armature.length - 1].end);
//         if (pullForce.norm > 10 * rotationSpeed / moment * bone.length) {
//             pullForce = pullForce.normalized().mul(10 * rotationSpeed / moment * bone.length);
//         }
//     }
//     let boneDir = bone.end.sub(bone.start).normalized();
//     let onAxis = boneDir.dot(pullForce);
//     let crossAxis = boneDir.cross(pullForce);
//     // Rotate bone
//     let diff = crossAxis / tracking.end.sub(bone.start).norm;
//     let maxDiff = rotationSpeed / moment;
//     let maxToTarget = clipAngle(target.sub(bone.start).angle - tracking.end.sub(bone.start).angle);
//     maxDiff = Math.min(maxDiff, Math.abs(maxToTarget));
//     diff = (diff > maxDiff) ? maxDiff : (diff < -maxDiff) ? -maxDiff : diff;
//     bone.angle += diff;
//     // Remaining force
//     pullForce = pullForce.mul(FRICTION).add(boneDir.mul(onAxis * (1 - FRICTION)));
//     return pullForce;
// }
