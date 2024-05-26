const FRAME_INTERVAL = 20;
const ARMATURE_PRESETS = new Map();
ARMATURE_PRESETS.set("example_level", buildArmGraphics({
    root: [280, 380],
    bones: [
        { length: 110, speed: 1, width: 30 },
        { length: 80, speed: 1.5, width: 20 },
        { length: 60, speed: 2.5, width: 20 },
        { length: 45, speed: 3, width: 18 }
    ]
}));
var game = new Game();
game.armature = ARMATURE_PRESETS.get("example_level");
game.components = [];
game.components.push(
// Wire lights
// Obstacles
new SimpleObstacle(new ConvexPolygonCollider([
    new Vector(70, 0), new Vector(70, 100),
    new Vector(160, 100), new Vector(160, 0)
])), new SimpleObstacle(new ConvexPolygonCollider([
    new Vector(80, 250), new Vector(80, 280),
    new Vector(150, 280), new Vector(150, 250)
])), new SimpleObstacle(new ConvexPolygonCollider([
    new Vector(70, 230), new Vector(70, 250), new Vector(100, 270),
    new Vector(130, 270), new Vector(160, 250), new Vector(160, 230)
])), new SimpleObstacle(new ConvexPolygonCollider([
    new Vector(400, 0), new Vector(400, 100),
    new Vector(490, 100), new Vector(490, 0)
])), new SimpleObstacle(new ConvexPolygonCollider([
    new Vector(410, 250), new Vector(410, 280),
    new Vector(480, 280), new Vector(480, 250)
])), new SimpleObstacle(new ConvexPolygonCollider([
    new Vector(400, 230), new Vector(400, 250), new Vector(430, 270),
    new Vector(460, 270), new Vector(490, 250), new Vector(490, 230)
])), new SimpleObstacle(new ConvexPolygonCollider([
    new Vector(250, 0), new Vector(250, 40),
    new Vector(310, 40), new Vector(310, 0),
])), new SimpleObstacle(new ConvexPolygonCollider([
    new Vector(620, 0), new Vector(620, 40),
    new Vector(680, 40), new Vector(680, 0),
])), new SimpleObstacle(new ConvexPolygonCollider([
    new Vector(0, 400), new Vector(100, 400),
    new Vector(100, 425), new Vector(0, 425),
])), new SimpleObstacle(new ConvexPolygonCollider([
    new Vector(80, 540), new Vector(110, 540),
    new Vector(110, 590), new Vector(80, 590),
])), new SimpleObstacle(new ConvexPolygonCollider([
    new Vector(0, 525), new Vector(100, 525),
    new Vector(100, 600), new Vector(0, 600),
])), new SimpleObstacle(new ConvexPolygonCollider([
    new Vector(530, 720), new Vector(530, 680),
    new Vector(650, 680), new Vector(650, 720),
])), new SimpleObstacle(new ConvexPolygonCollider([
    new Vector(520, 720), new Vector(520, 580),
    new Vector(540, 580), new Vector(540, 720),
])), new SimpleObstacle(new ConvexPolygonCollider([
    new Vector(640, 720), new Vector(640, 580),
    new Vector(660, 580), new Vector(660, 720),
])), new SimpleObstacle(new ConvexPolygonCollider([
    new Vector(770, 460), new Vector(870, 460),
    new Vector(870, 495), new Vector(770, 495),
])), new SimpleObstacle(new ConvexPolygonCollider([
    new Vector(770, 580), new Vector(870, 580),
    new Vector(870, 615), new Vector(820, 625), new Vector(770, 615),
])), new SimpleObstacle(new ConvexPolygonCollider([
    new Vector(0, 525), new Vector(100, 525),
    new Vector(100, 600), new Vector(0, 600),
])), 
// Interactibles
new Button(new Vector(115, 280), new Vector(0, 1), {
    speed: 2, width: 60, depth: 20
}), new Button(new Vector(445, 280), new Vector(0, 1), {
    speed: 2, width: 60, depth: 20
}), new Button(new Vector(110, 565), new Vector(1, 0), {
    speed: 2, width: 40, depth: 15
}), new ChainPull(new Vector(280, 40), {
    speed: 2, length: 85, maxLength: 125
}), new ChainPull(new Vector(650, 40), {
    speed: 2, length: 85, maxLength: 125
}), new Lever(new Vector(515, 645), new Vector(-1, 0), {
    speed: 0.5, length: 50, maxRotation: Math.PI / 4
}), new SimpleObstacle(new ConvexPolygonCollider([
    new Vector(520, 620), new Vector(510, 620),
    new Vector(510, 670), new Vector(520, 670),
])), new SimpleObject(new Vector(50, 490)));
// for (let i = 0; i < 4; i++) {
//     let button = game.components[2*i + 6];
//     let wireLight = game.components[i];
//     let light = game.components[i + 14];
//     if (iofIOutputter(button) && iofIInputter(wireLight) && iofIInputter(light)) {
//         game.components.push(
//             new SimpleCircuit(button, wireLight),
//             new SimpleCircuit(button, light)
//         );
//     }
// }
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
    background(ctx, "#180F26");
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
