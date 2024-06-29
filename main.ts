const FRAME_INTERVAL = 17;

const ARMATURE_PRESETS = new Map<string, BoneGraphics[]>();
ARMATURE_PRESETS.set("example_level", buildArmGraphics({
    root: [ 280, 380 ],
    bones: [
        { length: 110, speed: 3, width: 30 },
        { length: 80, speed: 5, width: 20 },
        { length: 60, speed: 6, width: 20 },
        { length: 45, speed: 5, width: 18 }
    ]
}));

var game = new Game();
game.armature = ARMATURE_PRESETS.get("example_level")!;
game.components = [];
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
        new Vector(100, 430), new Vector(0, 430),
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
        speed: 1.5, width: 40, depth: 15
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
    new FireworkFiller(
        new Vector(115, 175), FireworkElement.COPPER, 1.5,
        new Vector(75, 100), new Vector(155, 230),
        { radius: 40 }
    ),
    new FireworkFiller(
        new Vector(445, 175), FireworkElement.STRONTIUM, 2.5,
        new Vector(405, 100), new Vector(485, 230),
        { radius: 40 }
    ),
    new FireworkPreparer(new Vector(590, 630), { radius: 40 }),
    new FireworkLauncher(new Vector(820, 540), { radius: 40 }),
    new AlwaysOn(),

    new FireworkSpawner(new Vector(50, 490), 2, 4, []),

    new Carrier(game.armature[0].parent!, [
        new Vector(280, 380),
        new Vector(580, 415)
    ], { speed: 200 }),
    // Aesthetics
    new Light(new Vector(115, 50)),
    new Light(new Vector(445, 50)),
    new Light(new Vector(50, 565), 5),
    new CounterLight(new Vector(50, 415), 2),
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
    new ActivatorCircuit(
        game.searchComponents<Button>(Button)[2],
        game.searchComponents<FireworkSpawner>(FireworkSpawner)[0],
        1
    ),
    new ActivatorCircuit(
        game.searchComponents<Button>(Button)[0],
        game.searchComponents<FireworkFiller>(FireworkFiller)[0],
        1
    ),
    new ActivatorCircuit(
        game.searchComponents<Button>(Button)[1],
        game.searchComponents<FireworkFiller>(FireworkFiller)[1],
        1
    ),
    new ActivatorCircuit(
        game.searchComponents<Lever>(Lever)[0],
        game.searchComponents<FireworkPreparer>(FireworkPreparer)[0],
        1
    ),
    new SimpleCircuit(
        game.searchComponents<AlwaysOn>(AlwaysOn)[0],
        game.searchComponents<FireworkLauncher>(FireworkLauncher)[0]
    ),
    new SimpleCircuit(
        game.searchComponents<FireworkSpawner>(FireworkSpawner)[0],
        game.searchComponents<CounterLight>(CounterLight)[0]
    ),
);
game.searchComponents<FireworkSpawner>(FireworkSpawner)[0].input = 1;


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
    background(ctx, "hsl(264, 30%, 5%)");
}

function background(ctx: CanvasRenderingContext2D, color: string) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.closePath();
    ctx.lineWidth = 1;
    // for (let x = 0; x < ctx.canvas.width; x += 10) {
    //     ctx.strokeStyle = (x % 50 == 0) ? "#222" : "#111";
    //     ctx.beginPath();
    //     ctx.moveTo(x, 0);
    //     ctx.lineTo(x, ctx.canvas.height);
    //     ctx.closePath();
    //     ctx.stroke();
    // }
    // for (let y = 0; y < ctx.canvas.height; y += 10) {
    //     ctx.strokeStyle = (y % 50 == 0) ? "#222" : "#111";
    //     ctx.beginPath();
    //     ctx.moveTo(0, y);
    //     ctx.lineTo(ctx.canvas.width, y);
    //     ctx.closePath();
    //     ctx.stroke();
    // }
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
                // DEBUG
                // game.spawnObject(new FireworkExplosion(
                //     mousePosition, 280, [FireworkElement.GUNPOWDER, FireworkElement.GUNPOWDER]
                // ));
                game.spawnObject(new FireworkTrail(
                    mousePosition, 280, new Array(3).fill(1 + Math.floor(mousePosition.x / 240))
                ));
            })
            canvas.addEventListener("mouseup", event => {
                isMousePressed = false;
                mouseJustPressed = false;
            })
        }
    }
};
