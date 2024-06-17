const FRAME_INTERVAL = 17;

const ARMATURE_PRESETS = new Map<string, BoneGraphics[]>();
ARMATURE_PRESETS.set("example_level", buildArmGraphics({
    root: [ 280, 380 ],
    bones: [
        { length: 110, speed: 1.5, width: 30 },
        { length: 80, speed: 2.5, width: 20 },
        { length: 60, speed: 3, width: 20 },
        { length: 45, speed: 2.5, width: 18 }
    ]
}));

var game = new Game();
game.armature = ARMATURE_PRESETS.get("example_level")!;
game.components = [];
// new SimpleObstacle(new ConvexPolygonCollider([
//     new Vector(530, 720), new Vector(530, 680),
//     new Vector(650, 680), new Vector(650, 720),
// ])),
// new SimpleObstacle(new ConvexPolygonCollider([
//     new Vector(520, 720), new Vector(520, 580),
//     new Vector(540, 580), new Vector(540, 720),
// ])),
// new SimpleObstacle(new ConvexPolygonCollider([
//     new Vector(640, 720), new Vector(640, 580),
//     new Vector(660, 580), new Vector(660, 720),
// ])),
game.components.push(
    // Wire lights
    new WireLight([
        new Vector(530, 660), new Vector(650, 660),
        new Vector(650, 630), new Vector(530, 630),
        new Vector(530, 600), new Vector(650, 600)
    ], 200),
    // Obstacles
    new SimpleObstacle(new ConvexPolygonCollider([
        new Vector(70, 0), new Vector(70, 100),
        new Vector(160, 100), new Vector(160, 0)
    ])),
    new SimpleObstacle(new ConvexPolygonCollider([
        new Vector(80, 250), new Vector(80, 280),
        new Vector(150, 280), new Vector(150, 250)
    ])),
    new SimpleObstacle(new ConvexPolygonCollider([
        new Vector(70, 230), new Vector(70, 250), new Vector(100, 270),
        new Vector(130, 270), new Vector(160, 250), new Vector(160, 230)
    ])),

    new SimpleObstacle(new ConvexPolygonCollider([
        new Vector(400, 0), new Vector(400, 100),
        new Vector(490, 100), new Vector(490, 0)
    ])),
    new SimpleObstacle(new ConvexPolygonCollider([
        new Vector(410, 250), new Vector(410, 280),
        new Vector(480, 280), new Vector(480, 250)
    ])),
    new SimpleObstacle(new ConvexPolygonCollider([
        new Vector(400, 230), new Vector(400, 250), new Vector(430, 270),
        new Vector(460, 270), new Vector(490, 250), new Vector(490, 230)
    ])),
    
    new SimpleObstacle(new ConvexPolygonCollider([
        new Vector(250, 0), new Vector(250, 40),
        new Vector(310, 40), new Vector(310, 0),
    ])),
    new SimpleObstacle(new ConvexPolygonCollider([
        new Vector(620, 0), new Vector(620, 40),
        new Vector(680, 40), new Vector(680, 0),
    ])),

    new SimpleObstacle(new ConvexPolygonCollider([
        new Vector(0, 400), new Vector(100, 400),
        new Vector(100, 425), new Vector(0, 425),
    ])),
    new SimpleObstacle(new ConvexPolygonCollider([
        new Vector(80, 540), new Vector(110, 540),
        new Vector(110, 590), new Vector(80, 590),
    ])),
    new SimpleObstacle(new ConvexPolygonCollider([
        new Vector(0, 525), new Vector(100, 525),
        new Vector(100, 600), new Vector(0, 600),
    ])),

    new SimpleObstacle(new ConvexPolygonCollider([
        new Vector(530, 720), new Vector(530, 680),
        new Vector(650, 680), new Vector(650, 720),
    ])),
    new SimpleObstacle(new ConvexPolygonCollider([
        new Vector(520, 720), new Vector(520, 580),
        new Vector(540, 580), new Vector(540, 720),
    ])),
    new SimpleObstacle(new ConvexPolygonCollider([
        new Vector(640, 720), new Vector(640, 580),
        new Vector(660, 580), new Vector(660, 720),
    ])),

    new SimpleObstacle(new ConvexPolygonCollider([
        new Vector(770, 460), new Vector(870, 460),
        new Vector(870, 495), new Vector(770, 495),
    ])),
    new SimpleObstacle(new ConvexPolygonCollider([
        new Vector(770, 580), new Vector(870, 580),
        new Vector(870, 615), new Vector(820, 625), new Vector(770, 615),
    ])),
    new SimpleObstacle(new ConvexPolygonCollider([
        new Vector(0, 525), new Vector(100, 525),
        new Vector(100, 600), new Vector(0, 600),
    ])),
    // Interactibles
    new Button(new Vector(115, 280), new Vector(0, 1), {
        speed: 2, width: 60, depth: 20
    }),
    new Button(new Vector(445, 280), new Vector(0, 1), {
        speed: 2, width: 60, depth: 20
    }),

    new Button(new Vector(110, 565), new Vector(1, 0), {
        speed: 2, width: 40, depth: 15
    }),

    new ChainPull(new Vector(280, 40), {
        speed: 2, length: 85, maxLength: 125
    }),
    new ChainPull(new Vector(650, 40), {
        speed: 2, length: 100, maxLength: 140
    }),

    new Lever(new Vector(515, 645), new Vector(-1, 0), {
        speed: 2, length: 50, maxRotation: Math.PI / 4
    }),
    new SimpleObstacle(new ConvexPolygonCollider([
        new Vector(520, 620), new Vector(510, 620),
        new Vector(510, 670), new Vector(520, 670),
    ])),

    // Attractors
    new SimpleAttractor(new Vector(115, 165), { radius: 40 }),
    new SimpleAttractor(new Vector(445, 165), { radius: 40 }),
    new SimpleAttractor(new Vector(590, 630), { radius: 40 }),
    new SimpleAttractor(new Vector(820, 540), { radius: 40 }),

    new SimpleObject(new Vector(50, 490), { width: 40 }),

    new Carrier(game.armature[0].parent!, [
        new Vector(280, 380),
        new Vector(580, 415)
    ], { speed: 200 }),
    // Aesthetics
    new Light(new Vector(115, 50)),
    new Light(new Vector(445, 50)),
    new Light(new Vector(50, 565), 5),
);

// Manually link up for now
for (let i = 0; i < 3; i++) {
    game.components.push(
        new SimpleCircuit(
            game.searchComponents<Button>(Button)[i],
            game.searchComponents<Light>(Light)[i]
        )
    );
}
game.components.push(
    new SimpleCircuit(
        game.searchComponents<ChainPull>(ChainPull)[0],
        game.searchComponents<Carrier>(Carrier)[0]
    ),
    new SimpleCircuit(
        game.searchComponents<ChainPull>(ChainPull)[1],
        game.searchComponents<Carrier>(Carrier)[0]
    ),
    new SimpleCircuit(
        game.searchComponents<Lever>(Lever)[0],
        game.searchComponents<WireLight>(WireLight)[0]
    ),
);


var run = true;
var mousePosition = new Vector(100, 100);
var isMousePressed = false;
var mouseJustPressed = false;


function setup(ctx: CanvasRenderingContext2D) {
    ctx.lineWidth = 10;
    ctx.lineJoin = "bevel";
    ctx.strokeStyle = "white";
    ctx.fillStyle = "white";
    ctx.lineCap = "round";
    background(ctx, "#1a1620");
}

function background(ctx: CanvasRenderingContext2D, color: string) {
    let fill = ctx.fillStyle;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = fill;
}

function update(ctx: CanvasRenderingContext2D) {
    if (!run) return;
    game.update();
    game.render();
}


document.onreadystatechange = function(event) {
    if (document.readyState == "complete") {
        // Set up canvas
        let canvas = document.querySelector("#simulation");
        if (canvas instanceof HTMLCanvasElement) {
            let context = canvas.getContext("2d");
            game.ctx = context!;
            window.setInterval(update, FRAME_INTERVAL, context);
            canvas.addEventListener("mousemove", event => {
                mousePosition = new Vector(event.offsetX, event.offsetY);
            });
            canvas.addEventListener("mousedown", event => {
                isMousePressed = true;
                mouseJustPressed = true;
            })
            canvas.addEventListener("mouseup", event => {
                isMousePressed = false;
                mouseJustPressed = false;
            })
        }
    }
};
