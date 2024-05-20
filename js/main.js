const FRAME_INTERVAL = 20;
const ARMATURE_PRESETS = new Map();
ARMATURE_PRESETS.set("simple_joints", buildArmGraphics({
    root: [300, 300],
    bones: [
        { length: 120, speed: 0.05, width: 15 },
        { length: 110, speed: 0.08, width: 10 },
        { length: 30, speed: 0.05, width: 6 }
    ]
}));
ARMATURE_PRESETS.set("human_arm", buildArmGraphics({
    root: [300, 300],
    bones: [
        { length: 120, speed: 0.05, width: 15 },
        { length: 100, speed: 0.08, width: 13 },
        { length: 20, speed: 0.02, width: 8 },
        { length: 10, speed: 0.05, width: 6 },
        { length: 10, speed: 0.02, width: 6 }
    ]
}));
ARMATURE_PRESETS.set("many_joints", buildArmGraphics({
    root: [300, 300],
    bones: [
        { length: 100, speed: 0.04, width: 13 },
        { length: 25, speed: 0.04, width: 8 },
        { length: 80, speed: 0.04, width: 10 },
        { length: 35, speed: 0.04, width: 8 },
        { length: 10, speed: 0.07, width: 6 },
        { length: 10, speed: 0.05, width: 6 }
    ]
}));
ARMATURE_PRESETS.set("slow_arm", buildArmGraphics({
    root: [300, 300],
    bones: [
        { length: 140, speed: 0.02, width: 15 },
        { length: 65, speed: 0.05, width: 8 },
        { length: 35, speed: 0.08, width: 10 },
        { length: 10, speed: 0.03, width: 6 },
        { length: 10, speed: 0.03, width: 6 }
    ]
}));
ARMATURE_PRESETS.set("retracting_arm", buildArmGraphics({
    root: [300, 300],
    bones: [
        { length: 100, speed: 0.015, width: 15 },
        { length: 75, speed: 0.03, width: 9 },
        { length: 75, speed: 0.03, width: 9 },
        { length: 65, speed: 0.05, width: 8 },
        { length: 45, speed: 0.03, width: 6 },
        { length: 45, speed: 0.03, width: 6 },
        { length: 35, speed: 0.08, width: 10 },
        { length: 10, speed: 0.03, width: 6 },
        { length: 10, speed: 0.03, width: 6 }
    ]
}));
var armature = ARMATURE_PRESETS.get("retracting_arm");
var colliders = [
    new CircleCollider(new Vector(500, 300), 50),
    // new NewHalfPlaneCollider(new Vector(200, 200), new Vector(50, 200).normalized()),
    new ConvexPolygonCollider([
        new Vector(100, 200), new Vector(250, 100), new Vector(150, 50)
    ]),
];
var constraints = [
// new CircleConstraint(new Vector(250, 300), 200)
];
var run = true;
var mouse = new Vector(100, 100);
var retracted = true;
var motionPoint = 0;
function setup(ctx) {
    ctx.lineWidth = 10;
    ctx.lineJoin = "bevel";
    ctx.strokeStyle = "white";
    ctx.fillStyle = "white";
    ctx.lineCap = "round";
    background(ctx, "black");
}
function background(ctx, color) {
    let fill = ctx.fillStyle;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = fill;
}
function update(ctx) {
    if (!run)
        return;
    if (armature[0].parent != null) {
        armature[0].parent.transform.localPosition = new Vector(300, 300 + 6 * Math.sin(motionPoint));
        motionPoint = motionPoint + TWO_PI / 80;
    }
    const MAX_ITER = 4;
    for (let i = 0; i < MAX_ITER; i++) {
        let moments = computeMoI(armature);
        for (let j = 0; j < armature.length; j++) {
            // Compute desired trajectory
            let desiredRotation = boneTrack(armature[j], mouse, armature[armature.length - 1], moments[j], armature[j].rotationSpeed / MAX_ITER);
            // TODO (for fun!)
            if (retracted && armature == ARMATURE_PRESETS.get("retracting_arm")) {
                if (j == 1 || j == 4) {
                    desiredRotation = boneTrack(armature[j], armature[j - 1].start, armature[j], moments[j], 4 * armature[j].rotationSpeed / MAX_ITER);
                }
                if (j == 2 || j == 5) {
                    let to180 = clipAngle(Math.PI - armature[j].angle);
                    if (Math.abs(armature[j].angle) < Math.PI / 2) {
                        let direction = Math.sign(armature[j - 1].angle);
                        if (direction < 0)
                            to180 = Math.PI - armature[j].angle;
                        else
                            to180 = -Math.PI - armature[j].angle;
                    }
                    let maxDiff = 4 * armature[j].rotationSpeed / MAX_ITER / moments[j];
                    desiredRotation = (to180 > maxDiff) ? maxDiff
                        : (to180 < -maxDiff) ? -maxDiff
                            : to180;
                }
            }
            // Adjust for constraints
            desiredRotation = boneConstrain(armature[j], armature[armature.length - 1], desiredRotation, constraints);
            // Adjust for collisions
            for (let k = j; k < armature.length; k++) {
                let collisions = getCollisions(armature[j], armature[k], colliders);
                desiredRotation = adjustForCollisions(desiredRotation, collisions);
            }
            armature[j].angle += desiredRotation;
        }
    }
    // Draw armature
    setup(ctx);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#00ff8c";
    for (let i = 0; i < constraints.length; i++) {
        constraints[i].render(ctx);
    }
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#008cff";
    for (let i = 0; i < colliders.length; i++) {
        colliders[i].render(ctx);
    }
    ctx.lineWidth = 2;
    ctx.strokeStyle = "white";
    for (let i = 0; i < armature.length; i++) {
        armature[i].render(ctx);
    }
}
document.onreadystatechange = function (event) {
    if (document.readyState == "complete") {
        // Set up selector
        let selector = document.querySelector("#armature");
        for (let key of ARMATURE_PRESETS.keys()) {
            let element = document.createElement("option");
            element.setAttribute("value", key);
            element.innerText = key;
            selector?.appendChild(element);
        }
        selector.addEventListener("change", function (event) {
            if (event.target instanceof HTMLSelectElement) {
                let result = ARMATURE_PRESETS.get(event.target.value);
                if (result != null) {
                    armature = result;
                }
            }
        });
        selector.querySelector("option[value=retracting_arm]")?.setAttribute("selected", "selected");
        // Set up canvas
        let canvas = document.querySelector("#simulation");
        if (canvas instanceof HTMLCanvasElement) {
            let context = canvas.getContext("2d");
            window.setInterval(update, FRAME_INTERVAL, context);
            canvas.addEventListener("mousemove", event => {
                mouse = new Vector(event.offsetX, event.offsetY);
            });
            canvas.addEventListener("mousedown", event => {
                retracted = false;
            });
            canvas.addEventListener("mouseup", event => {
                retracted = true;
            });
            // canvas.addEventListener("click", event => {
            //     run = !run;
            // });
        }
    }
};
