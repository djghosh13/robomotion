class Transform {
    constructor(
            public localPosition: Vector,
            private lRot: number,
            public readonly parent?: Transform
        ) { }
    get isGlobal() { return this.parent == null; }
    get localRotation() { return this.lRot; }
    set localRotation(value: number) { this.lRot = clipAngle(value); }
    get position(): Vector {
        if (this.parent != null) {
            return this.localPosition.rotate(this.parent.rotation).add(this.parent.position);
        }
        return this.localPosition;
    }
    get rotation(): number {
        if (this.parent != null) {
            return this.localRotation + this.parent.rotation;
        }
        return this.localRotation;
    }
}


class Bone {
    readonly offset: Vector;
    readonly parent?: Bone;
    readonly transform: Transform;

    constructor(offset: Vector | number, parent?: Bone) {
        if (!(offset instanceof Vector)) {
            offset = new Vector(offset, 0);
        }
        this.offset = offset;
        this.parent = parent;
        if (parent != null) {
            this.transform = new Transform(offset, 0, parent.transform);
        } else {
            this.transform = new Transform(offset, 0);
        }
    }
    get start() { return this.parent?.transform.position ?? this.transform.position; }
    get end() { return this.transform.position; }
    get length() { return this.offset.norm; }
    get angle() {
        return this.parent?.transform.localRotation ?? 0;
    }
    set angle(value: number) {
        if (this.parent != null) {
            this.parent.transform.localRotation = clipAngle(value);
        }
    }
    pointTo(point: Vector) {
        let direction = point.sub(this.start).angle;
        this.angle += direction - (this.parent?.transform.rotation ?? this.transform.rotation);
    }
}

class Root extends Bone {
    constructor(position: Vector) {
        super(position);
    }
}


class BonePhysics extends Bone {
    rotationSpeed: number;

    constructor(offset: Vector | number, parent: Bone, speed: number) {
        super(offset, parent);
        this.rotationSpeed = speed;
    }
}


type BoneParameters = {
    length: number;
    speed?: number;
};
type ArmParameters = {
    root: Root | Vector | number[];
    bones: BoneParameters[];
};

function buildArm(params: ArmParameters) {
    let bones: Bone[] = [];
    // Root node
    if (params.root instanceof Root) {
        bones.push(params.root);
    } else if (params.root instanceof Vector) {
        bones.push(new Root(params.root));
    } else {
        bones.push(new Root(new Vector(params.root[0], params.root[1])));
    }
    // Bones
    for (let i = 0; i < params.bones.length; i++) {
        bones.push(new Bone(params.bones[i].length, bones[i]));
    }
    return bones;
}
