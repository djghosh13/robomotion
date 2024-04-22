function fiztrak(armature, target, rotationSpeed) {
    // Compute moment of inertia
    let moments = [];
    let totalWeight = 0;
    for (let i = armature.length - 1; i >= 0; i--) {
        let rootPoint = armature[i].start;
        let rotationalWeight = 0;
        for (let j = i; j < armature.length; j++) {
            // 5-sample estimate of moment
            const samplePoints = [0.1, 0.3, 0.5, 0.7, 0.9];
            let moment = lerpVector(armature[j].start, armature[j].end, samplePoints).map(midpoint => midpoint.sub(rootPoint).norm).reduce((a, x) => a + x) / samplePoints.length * armature[j].length;
            rotationalWeight += moment;
        }
        totalWeight += armature[i].length;
        moments.unshift(rotationalWeight / totalWeight / totalWeight * 2);
    }
    // Track
    for (let i = 0; i < armature.length; i++) {
        let diff = clipAngle(target.sub(armature[i].start).angle - armature[armature.length - 1].end.sub(armature[i].start).angle);
        let maxDiff;
        if (rotationSpeed instanceof Array) {
            maxDiff = rotationSpeed[i] / moments[i];
        }
        else {
            maxDiff = rotationSpeed / moments[i];
        }
        diff = (diff > maxDiff) ? maxDiff : (diff < -maxDiff) ? -maxDiff : diff;
        armature[i].angle += diff;
    }
}
function lerpVector(start, end, value) {
    return value.map(v => start.mul(1 - v).add(end.mul(v)));
}
