var game = new Game();
game.spawnObject(MouseController.instance);
game.spawnObject(new FireworkParticleManager());
let example_level = `{"props":{"t":"type","p":"points","po":"position","a":"activator","r":"responder","s":"speed","l":"length","w":"width","f":"facing","ra":"radius","c":"cooldown","d":"depth","m":"maxLength","e":"element","ti":"time","to":"topLeft","b":"bottomRight","h":"hue"},"strings":{"S":"SimpleObstacle","Si":"SimpleCircuit","A":"ActivatorCircuit","B":"Button","L":"Light","r":"robot0","C":"ChainPull","F":"FireworkFiller","b":"button0","bu":"button1","but":"button_spawn","c":"carrier0","l":"lever0","f":"fireworkspawner0"},"data":{"robot0":{"t":"RobotArm","armature":[{"l":110,"s":3,"w":30},{"l":80,"s":5,"w":20},{"l":60,"s":6,"w":20},{"l":45,"s":5,"w":18}]},"carrier0":{"t":"Carrier","robotArm":"r","positions":[[280,380],[580,415]],"s":200},"camera0":{"t":"Camera","target":"r"},"button0":{"t":"B","po":[115,280],"f":[0,1],"s":2,"w":60,"d":20},"button1":{"t":"B","po":[445,280],"f":[0,1],"s":2,"w":60,"d":20},"button_spawn":{"t":"B","po":[110,565],"f":[1,0],"s":1.5,"w":40,"d":15},"chainpull0":{"t":"C","po":[280,40],"s":2,"l":85,"m":125},"chainpull1":{"t":"C","po":[650,40],"s":2,"l":100,"m":140},"lever0":{"t":"Lever","po":[515,645],"f":[-1,0],"s":2,"l":50,"maxRotation":45},"fireworkfiller0":{"t":"F","po":[115,175],"e":"COPPER","ti":1.5,"to":[75,100],"b":[155,230],"ra":40},"fireworkfiller1":{"t":"F","po":[445,175],"e":"STRONTIUM","ti":2.5,"to":[405,100],"b":[485,230],"ra":40},"fireworkpreparer0":{"t":"FireworkPreparer","po":[590,630],"ra":40},"fireworklauncher0":{"t":"FireworkLauncher","po":[820,540],"ra":40},"fireworkspawner0":{"t":"FireworkSpawner","po":[50,490],"maxFireworks":2,"capacity":4,"elements":[]},"wirelight0":{"t":"WireLight","p":[[530,660],[650,660],[650,630],[530,630],[530,600],[650,600]],"h":200},"light0":{"t":"L","po":[115,50]},"light1":{"t":"L","po":[445,50]},"light_spawn":{"t":"L","po":[50,565],"h":5},"counterlight_spawn":{"t":"CounterLight","po":[50,415],"maxCount":2},"alwayson0":{"t":"AlwaysOn"},"simplecircuit0":{"t":"Si","a":"b","r":"light0"},"simplecircuit1":{"t":"Si","a":"bu","r":"light1"},"simplecircuit_spawn":{"t":"Si","a":"but","r":"light_spawn"},"simplecircuit_chain0":{"t":"Si","a":"chainpull0","r":"c"},"simplecircuit_chain1":{"t":"Si","a":"chainpull1","r":"c"},"simplecircuit_lever0":{"t":"Si","a":"l","r":"wirelight0"},"activatorcircuit_spawn":{"t":"A","a":"but","r":"f","c":1},"activatorcircuit0":{"t":"A","a":"b","r":"fireworkfiller0","c":1},"activatorcircuit1":{"t":"A","a":"bu","r":"fireworkfiller1","c":1},"activatorcircuit_lever0":{"t":"A","a":"l","r":"fireworkpreparer0","c":1},"simplecircuit_launch":{"t":"Si","a":"alwayson0","r":"fireworklauncher0"},"simplecircuit_count":{"t":"Si","a":"f","r":"counterlight_spawn"},"obstacle0":{"t":"S","p":[[70,0],[70,100],[160,100],[160,0]]},"obstacle1":{"t":"S","p":[[80,250],[80,280],[150,280],[150,250]]},"obstacle2":{"t":"S","p":[[70,230],[70,250],[100,270],[130,270],[160,250],[160,230]]},"obstacle3":{"t":"S","p":[[400,0],[400,100],[490,100],[490,0]]},"obstacle4":{"t":"S","p":[[410,250],[410,280],[480,280],[480,250]]},"obstacle5":{"t":"S","p":[[400,230],[400,250],[430,270],[460,270],[490,250],[490,230]]},"obstacle6":{"t":"S","p":[[250,0],[250,40],[310,40],[310,0]]},"obstacle7":{"t":"S","p":[[620,0],[620,40],[680,40],[680,0]]},"obstacle8":{"t":"S","p":[[0,400],[100,400],[100,430],[0,430]]},"obstacle9":{"t":"S","p":[[80,540],[110,540],[110,590],[80,590]]},"obstacle10":{"t":"S","p":[[0,525],[100,525],[100,600],[0,600]]},"obstacle11":{"t":"S","p":[[530,720],[530,680],[650,680],[650,720]]},"obstacle12":{"t":"S","p":[[520,720],[520,580],[540,580],[540,720]]},"obstacle13":{"t":"S","p":[[640,720],[640,580],[660,580],[660,720]]},"obstacle14":{"t":"S","p":[[770,460],[870,460],[870,495],[770,495]]},"obstacle15":{"t":"S","p":[[770,580],[870,580],[870,615],[820,625],[770,615]]},"obstacle16":{"t":"S","p":[[0,525],[100,525],[100,600],[0,600]]},"obstacle17":{"t":"S","p":[[520,620],[510,620],[510,670],[520,670]]}}}`;
let silly_level = `{"props":{"t":"type","s":"speed","l":"length","p":"position","w":"width","a":"activator","r":"responder"},"strings":{"S":"SimpleCircuit","r":"robot","b":"biglever","o":"on"},"data":{"robot":{"t":"RobotArm","armature":[{"l":110,"s":3,"w":30},{"l":80,"s":5,"w":20},{"l":60,"s":6,"w":20},{"l":45,"s":5,"w":18}]},"carrier":{"t":"Carrier","robotArm":"r","positions":[[0,0]]},"biglever":{"t":"Lever","p":[0,200],"facing":[0,-1],"s":2,"l":200},"bigblock":{"t":"SimpleObstacle","points":[[150,200],[150,300],[-150,300],[-150,200]]},"counterlight":{"t":"CounterLight","p":[0,250],"maxCount":10,"hue":270},"simplecircuit0":{"t":"S","a":"b","r":"counterlight"},"spawner":{"t":"FireworkSpawner","p":[300,250],"maxFireworks":2,"capacity":4,"elements":["COPPER","CALCIUM"]},"preparer":{"t":"FireworkPreparer","p":[300,240]},"launcher":{"t":"FireworkLauncher","p":[300,230],"s":0},"spawn_firework":{"t":"ActivatorCircuit","a":"b","r":"spawner","cooldown":1},"on":{"t":"AlwaysOn"},"prepare":{"t":"S","a":"o","r":"preparer"},"simplecircuit1":{"t":"S","a":"o","r":"launcher"},"camera":{"t":"Camera","target":"r"}}}`;
for (let component of LevelData.Level.import(example_level).constructLevel()[0]) {
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
