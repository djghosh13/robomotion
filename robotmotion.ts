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
    bone.angle += diff;
}

function lerpVector(start: Vector, end: Vector, value: number[]) {
    return value.map(v => start.mul(1 - v).add(end.mul(v)));
}
