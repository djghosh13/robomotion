// var armature: BoneGraphics[] = buildArmGraphics({
//     root: [ 300, 300 ],
//     bones: [
//         { length: 120, constraints: [ -1, 1 ], width: 15 },
//         { length: 100, constraints: [ -0.8, 0.01 ], width: 13 },
//         { length: 20, constraints: [ -0.4, 0.25 ], width: 8 },
//         { length: 10, constraints: [ -0.5, 0.01 ], width: 6 },
//         { length: 10, constraints: [ -0.5, 0.01 ], width: 6 }
//     ]
// });
// var armature = buildArmGraphics({
//     root: [ 300, 300 ],
//     bones: [
//         { length: 100, constraints: [ -1, 1 ], width: 13 },
//         { length: 25, constraints: [ -1, 1 ], width: 8 },
//         { length: 80, constraints: [ -0.8, 0.01 ], width: 10 },
//         { length: 35, constraints: [ -0.4, 0.25 ], width: 8 },
//         { length: 10, constraints: [ -0.5, 0.01 ], width: 6 },
//         { length: 10, constraints: [ -0.5, 0.01 ], width: 6 }
//     ]
// });
var armature = buildArmGraphics({
    root: [300, 300],
    bones: [
        { length: 140, constraints: [-1, 1], width: 15 },
        { length: 65, constraints: [-0.8, 0.01], width: 8 },
        { length: 35, constraints: [-0.4, 0.25], width: 10 },
        { length: 10, constraints: [-0.5, 0.01], width: 6 },
        { length: 10, constraints: [-0.5, 0.01], width: 6 }
    ]
});
var colliders = [
    new CircleCollider(new Vector(500, 300), 50)
];
var mouse = new Vector(100, 100);
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
    const MAX_ITER = 10;
    // TRACKING!
    // let error = ccd(armature[armature.length - 1], mouse);
    // for (let i = 0; i < MAX_ITER; i++) {
    //     error = ccd(armature[armature.length - 1], mouse);
    // }
    const MAX_ROTATION = [
        // 0.05, 0.1, 0.02, 0.05, 0.02
        // 0.05, 0.06, 0.06, 0.05, 0.02, 0.01
        0.02, 0.05, 0.08, 0.03, 0.03
    ].map(x => x / MAX_ITER);
    for (let i = 0; i < MAX_ITER; i++) {
        let moments = computeMoI(armature);
        // for (let j = armature.length - 1; j >= 0; j--) {
        //     boneTrack(armature[j], mouse, armature[armature.length - 1], moments[j], MAX_ROTATION[j]);
        //     if (boneCollide(armature[j], colliders)) {
        //         break;
        //     }
        // }
        for (let j = 0; j < armature.length; j++) {
            boneTrack(armature[j], mouse, armature[armature.length - 1], moments[j], MAX_ROTATION[j]);
        }
        for (let j = 0; j < armature.length; j++) {
            boneCollide(armature[j], colliders);
        }
    }
    // Draw armature
    setup(ctx);
    for (let i = 0; i < colliders.length; i++) {
        colliders[i].render(ctx);
    }
    for (let i = 0; i < armature.length; i++) {
        armature[i].render(ctx);
    }
}
document.onreadystatechange = function (event) {
    if (document.readyState == "complete") {
        let canvas = document.querySelector("#simulation");
        if (canvas instanceof HTMLCanvasElement) {
            let context = canvas.getContext("2d");
            window.setInterval(update, 25, context);
            canvas.addEventListener("mousemove", event => {
                mouse = new Vector(event.offsetX, event.offsetY);
            });
            canvas.addEventListener("click", event => {
                mouse = new Vector(event.offsetX, event.offsetY);
            });
        }
    }
};
