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
var armature = ARMATURE_PRESETS.get("slow_arm");
var colliders = [
    new CircleCollider(new Vector(500, 300), 50),
    new ConvexPolygonCollider([
        new Vector(100, 200), new Vector(250, 100), new Vector(150, 50)
    ]),
];
var game = new Game();
game.armature = ARMATURE_PRESETS.get("slow_arm");
game.components = [];
game.components.push(new WireLight([
    new Vector(150, 510), new Vector(150, 540),
    new Vector(200, 540), new Vector(200, 170),
    new Vector(180, 170)
], 40), new WireLight([
    new Vector(250, 510), new Vector(250, 590)
], 134), new WireLight([
    new Vector(350, 510), new Vector(350, 540),
    new Vector(500, 540), new Vector(500, 310)
], 190), new WireLight([
    new Vector(470, 80), new Vector(650, 80),
    new Vector(650, 490)
], 290), 
// Obstacles
new SimpleObstacle(new CircleCollider(new Vector(500, 300), 50)), new SimpleObstacle(new ConvexPolygonCollider([
    new Vector(80, 200), new Vector(230, 100), new Vector(130, 50)
])), 
// Interactibles
new Button(new Vector(150, 500), new Vector(0, -1), {}), new SimpleObstacle(new ConvexPolygonCollider([
    new Vector(125, 500), new Vector(175, 500),
    new Vector(175, 510), new Vector(125, 510)
])), new Button(new Vector(250, 500), new Vector(0, -1), { speed: 4 }), new SimpleObstacle(new ConvexPolygonCollider([
    new Vector(225, 500), new Vector(275, 500),
    new Vector(275, 510), new Vector(225, 510)
])), new Button(new Vector(350, 500), new Vector(0, -1), { speed: 2, width: 60, depth: 30 }), new SimpleObstacle(new ConvexPolygonCollider([
    new Vector(315, 500), new Vector(385, 500),
    new Vector(385, 510), new Vector(315, 510)
])), new ChainPull(new Vector(450, 100), { speed: 0.8 }), new SimpleObstacle(new ConvexPolygonCollider([
    new Vector(430, 100), new Vector(470, 100),
    new Vector(470, 60), new Vector(430, 60)
])), 
// Aesthetics
new Light(new Vector(170, 170), 40), new Light(new Vector(250, 600), 134), new Light(new Vector(500, 300), 190), new Light(new Vector(650, 500), 290), 
//
new Lever(new Vector(50, 350), new Vector(1, 0), { speed: 4 }), new SimpleObstacle(new ConvexPolygonCollider([
    new Vector(60, 320), new Vector(60, 380),
    new Vector(40, 380), new Vector(40, 320)
])));
for (let i = 0; i < 4; i++) {
    let button = game.components[2 * i + 6];
    let wireLight = game.components[i];
    let light = game.components[i + 14];
    if (iofIOutputter(button) && iofIInputter(wireLight) && iofIInputter(light)) {
        game.components.push(new SimpleCircuit(button, wireLight), new SimpleCircuit(button, light));
    }
}
var run = true;
var mousePosition = new Vector(100, 100);
var isMousePressed = false;
var mouseJustPressed = false;
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
    game.update();
    game.render();
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
                    game.armature = result;
                }
            }
        });
        selector.querySelector("option[value=retracting_arm]")?.setAttribute("selected", "selected");
        // Set up canvas
        let canvas = document.querySelector("#simulation");
        if (canvas instanceof HTMLCanvasElement) {
            let context = canvas.getContext("2d");
            game.ctx = context;
            window.setInterval(update, FRAME_INTERVAL, context);
            canvas.addEventListener("mousemove", event => {
                mousePosition = new Vector(event.offsetX, event.offsetY);
            });
            canvas.addEventListener("mousedown", event => {
                isMousePressed = true;
                mouseJustPressed = true;
            });
            canvas.addEventListener("mouseup", event => {
                isMousePressed = false;
                mouseJustPressed = false;
            });
        }
    }
};
