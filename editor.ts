class LevelEditor extends Game {
    level: LevelData.Level;
    camera: Vector;
    mouseAnchor: Vector | null;
    constructor(data: any | null) {
        super();
        this.level = new LevelData.Level(data || {});
        this.camera = SCREEN_SIZE.div(2);
        this.mouseAnchor = null;
        for (let component of this.level.constructLevel()) {
            this.spawnObject(component);
        }
    }
    override update() {
        if (MouseController.instance.justGrabbed()) {
            this.mouseAnchor = MouseController.instance.getTarget();
        }
        if (MouseController.instance.isGrabbing() && this.mouseAnchor != null) {
            this.camera = this.camera.add(this.mouseAnchor.sub(MouseController.instance.getTarget()));
        } else {
            this.mouseAnchor = null;
        }
        MouseController.instance.update(this);
        mouseJustPressed = false;
    }
    override getCameraOffset(): Vector {
        return SCREEN_SIZE.div(2).sub(this.camera).floor();
    }
}


var editor = new LevelEditor(simple_level);

var run = true;
var mousePosition = new Vector(100, 100);
var isMousePressed = false;
var mouseJustPressed = false;

var spfHistory: number[] = Array(60).fill(FRAME_INTERVAL);
var msptHistory: number[] = Array(60).fill(0);
var averageSPF = FRAME_INTERVAL;
var averageMSPT = 0;
var lastFrame = Date.now();

function editorUpdate(ctx: CanvasRenderingContext2D) {
    if (!run) return;
    let startTime = Date.now();

    editor.update();
    editor.render();

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
            editor.ctx = context!;
            window.setInterval(editorUpdate, FRAME_INTERVAL, context);
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
