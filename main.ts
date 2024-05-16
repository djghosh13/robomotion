const ARMATURE_PRESETS = new Map<string, BoneGraphics[]>();
ARMATURE_PRESETS.set("human_arm", buildArmGraphics({
    root: [ 300, 300 ],
    bones: [
        { length: 120, speed: 0.05, width: 15 },
        { length: 100, speed: 0.08, width: 13 },
        { length: 20, speed: 0.02, width: 8 },
        { length: 10, speed: 0.05, width: 6 },
        { length: 10, speed: 0.02, width: 6 }
    ]
}));
ARMATURE_PRESETS.set("many_joints", buildArmGraphics({
    root: [ 300, 300 ],
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
    root: [ 300, 300 ],
    bones: [
        { length: 140, speed: 0.02, width: 15 },
        { length: 65, speed: 0.05, width: 8 },
        { length: 35, speed: 0.08, width: 10 },
        { length: 10, speed: 0.03, width: 6 },
        { length: 10, speed: 0.03, width: 6 }
    ]
}));

var armature = ARMATURE_PRESETS.get("human_arm")!;
var colliders: Collider[] = [
    new CircleCollider(new Vector(500, 300), 50),
    new HalfPlaneCollider(new Vector(150, 150), new Vector(1, 1).normalized())
];

var mouse = new Vector(100, 100);


function setup(ctx: CanvasRenderingContext2D) {
    ctx.lineWidth = 10;
    ctx.lineJoin = "bevel";
    ctx.strokeStyle = "white";
    ctx.fillStyle = "white";
    ctx.lineCap = "round";
    background(ctx, "black");
}


function background(ctx: CanvasRenderingContext2D, color: string) {
    let fill = ctx.fillStyle;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = fill;
}

function update(ctx: CanvasRenderingContext2D) {
    const MAX_ITER = 4;
    for (let i = 0; i < MAX_ITER; i++) {
        let moments = computeMoI(armature);
        for (let j = 0; j < armature.length; j++) {
            let desiredAngle = boneTrack(
                armature[j], mouse, armature[armature.length - 1],
                moments[j], armature[j].rotationSpeed / MAX_ITER
            );
            for (let k = j; k < armature.length; k++) {
                desiredAngle = boneCollide(armature[j], armature[k], desiredAngle, colliders);
            }
            armature[j].angle += desiredAngle;
        }
    }
    // Draw armature
    setup(ctx);
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


document.onreadystatechange = function(event) {
    if (document.readyState == "complete") {
        // Set up selector
        let selector = document.querySelector("#armature")!;
        for (let key of ARMATURE_PRESETS.keys()) {
            let element = document.createElement("option");
            element.setAttribute("value", key);
            element.innerText = key;
            selector?.appendChild(element);
        }
        selector.addEventListener("change", function(event) {
            if (event.target instanceof HTMLSelectElement) {
                let result = ARMATURE_PRESETS.get(event.target.value);
                if (result != null) {
                    armature = result;
                }
            }
        })
        // Set up canvas
        let canvas = document.querySelector("#simulation");
        if (canvas instanceof HTMLCanvasElement) {
            let context = canvas.getContext("2d");
            window.setInterval(update, 20, context);
            canvas.addEventListener("mousemove", event => {
                mouse = new Vector(event.offsetX, event.offsetY);
            });
            canvas.addEventListener("click", event => {
                mouse = new Vector(event.offsetX, event.offsetY);
            });
        }
    }
};
