class Transform {
    constructor(localPosition, lRot, parent) {
        this.localPosition = localPosition;
        this.lRot = lRot;
        this.parent = parent;
    }
    get isGlobal() { return this.parent == null; }
    get localRotation() { return this.lRot; }
    set localRotation(value) { this.lRot = clipAngle(value); }
    get position() {
        if (this.parent != null) {
            return this.localPosition.rotate(this.parent.rotation).add(this.parent.position);
        }
        return this.localPosition;
    }
    get rotation() {
        if (this.parent != null) {
            return this.localRotation + this.parent.rotation;
        }
        return this.localRotation;
    }
}
class Bone {
    constructor(offset, parent) {
        if (!(offset instanceof Vector)) {
            offset = new Vector(offset, 0);
        }
        this.offset = offset;
        this.parent = parent;
        if (parent != null) {
            this.transform = new Transform(offset, 0, parent.transform);
        }
        else {
            this.transform = new Transform(offset, 0);
        }
    }
    get start() { return this.parent?.transform.position ?? this.transform.position; }
    get end() { return this.transform.position; }
    get length() { return this.offset.norm; }
    get angle() {
        return this.parent?.transform.localRotation ?? 0;
    }
    set angle(value) {
        if (this.parent != null) {
            this.parent.transform.localRotation = clipAngle(value);
        }
    }
    pointTo(point) {
        let direction = point.sub(this.start).angle;
        this.angle += direction - (this.parent?.transform.rotation ?? this.transform.rotation);
    }
}
class Root extends Bone {
    constructor(position) {
        super(position);
    }
}
class BonePhysics extends Bone {
    constructor(offset, parent, speed) {
        super(offset, parent);
        this.rotationSpeed = speed;
    }
}
function buildArm(params) {
    let bones = [];
    // Root node
    if (params.root instanceof Root) {
        bones.push(params.root);
    }
    else if (params.root instanceof Vector) {
        bones.push(new Root(params.root));
    }
    else {
        bones.push(new Root(new Vector(params.root[0], params.root[1])));
    }
    // Bones
    for (let i = 0; i < params.bones.length; i++) {
        bones.push(new Bone(params.bones[i].length, bones[i]));
    }
    return bones;
}
