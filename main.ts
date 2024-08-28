var game = new Game();
game.spawnObject(MouseController.instance);
game.spawnObject(new FireworkParticleManager());
for (let component of new LevelData.Level(simple_level).constructLevel()[0]) {
    game.spawnObject(component);
}

game.robotArms[0].controller = MouseController.instance;
game.searchComponents<FireworkSpawner>(FireworkSpawner).forEach(spawner => spawner.input = 1);


var run = true;
var mousePosition = new Vector(100, 100);
var isMousePressed = false;
var mouseJustPressed = false;


var spfHistory: number[] = Array(60).fill(FRAME_INTERVAL);
var msptHistory: number[] = Array(60).fill(0);
var averageSPF = FRAME_INTERVAL;
var averageMSPT = 0;
var lastFrame = Date.now();

function mainUpdate(ctx: CanvasRenderingContext2D) {
    if (!run) return;
    let startTime = Date.now();

    game.update();
    game.render();

    let endTime = Date.now();
    let spf = endTime - lastFrame;
    let mspt = endTime - startTime;
    lastFrame = endTime;
    spfHistory.push(spf);
    msptHistory.push(mspt);
    averageSPF += (spf - spfHistory.shift()!) / spfHistory.length;
    averageMSPT += (mspt - msptHistory.shift()!) / msptHistory.length;
    let fpsCounter = document.getElementById("fps-counter");
    if (fpsCounter != null) {
        fpsCounter.innerText = (1000 / averageSPF).toFixed(1);
        fpsCounter.style.color = (averageSPF < FRAME_INTERVAL * 1.1) ? "#6c6"
            : (averageSPF < FRAME_INTERVAL * 2) ? "#cc6"
            : "#c33";
    }
    let msptCounter = document.getElementById("mspt-counter");
    if (msptCounter != null) {
        msptCounter.innerText = averageMSPT.toFixed(1);
        msptCounter.style.color = (averageMSPT < FRAME_INTERVAL / 2) ? "#6c6"
            : (averageMSPT < FRAME_INTERVAL) ? "#cc6"
            : "#c33";
    }
}


document.onreadystatechange = function(event) {
    if (document.readyState == "complete") {
        // Set up canvas
        let canvas = document.querySelector("#simulation");
        if (canvas instanceof HTMLCanvasElement) {
            let context = canvas.getContext("2d");
            game.ctx = context!;
            window.setInterval(mainUpdate, FRAME_INTERVAL, context);
            canvas.addEventListener("mousemove", event => {
                mousePosition = new Vector(event.offsetX, event.offsetY);
                let debugCoords: HTMLElement | null = document.querySelector("#mouse-coords");
                if (debugCoords != null) {
                    let mousePos = MouseController.instance.getTarget();
                    debugCoords.innerText = `(${mousePos.x.toFixed(0)}, ${mousePos.y.toFixed(0)})`;
                }
            });
            canvas.addEventListener("mousedown", event => {
                isMousePressed = true;
                mouseJustPressed = true;
                // DEBUG
                game.spawnObject(new FireworkTrail(
                    MouseController.instance.getTarget(),
                    280,
                    new Array(3).fill(
                        1 + (Math.floor(MouseController.instance.getTarget().x / 100) % 7 + 7) % 7
                    )
                ));
            })
            canvas.addEventListener("mouseup", event => {
                isMousePressed = false;
                mouseJustPressed = false;
            })
        }
        // Debug
        document.addEventListener("keydown", event => {
            if (event.key.toLowerCase() == "f") {
                let debug: HTMLElement | null = document.querySelector("#debug-fps");
                if (debug != null) {
                    debug.style['display'] = (debug.style['display'] == "none") ? "block" : "none";
                }
            }
            if (event.key.toLowerCase() == "c") {
                let debug: HTMLElement | null = document.querySelector("#debug-coords");
                if (debug != null) {
                    debug.style['display'] = (debug.style['display'] == "none") ? "block" : "none";
                }
            }
        });
    }
};
