class LevelEditor extends Game {
    componentListElement: Element;
    componentEditorElement: Element;
    level: LevelData.Level;
    camera: Vector;
    mouseAnchor: Vector | null;
    constructor() {
        super();
        this.level = new LevelData.Level({ });
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
    refresh() {
        // Simple refresh: TODO
        while (this.components.length > 0) {
            this.destroyObject(this.components[0]);
        }
        for (let component of this.level.constructLevel()) {
            this.spawnObject(component);
        }
    }
    createComponent(type: Function, name?: string, data?: any) {
        const thisEditor = this;
        function shortTypeName(typeName: string) {
            let shortName = "";
            let nextLetters = 0;
            for (let i = 0; i < typeName.length; i++) {
                if (typeName.charAt(i) == typeName.charAt(i).toUpperCase()) {
                    shortName += typeName.charAt(i);
                    nextLetters = i + 1;
                }
            }
            while (shortName.length < 9 && nextLetters < typeName.length) {
                shortName += typeName.charAt(nextLetters);
                nextLetters++;
            }
            return shortName;
        }
        let specs = LevelData.OBJECT_REGISTRY.get(type)!;
        // Get next available name
        if (!name) {
            let defaultName = type.name.toLowerCase();
            let index = 0;
            while (this.level.components.has(defaultName + index)) {
                index++;
            }
            name = defaultName + index;
        }
        // Create component constructor and add to level
        this.level.addComponent(type, name, data || {});
        // Create editor element and populate with fields
        {
            let element = document.createElement("div");
            element.classList.add("component-entry");
            element.setAttribute("data-name", name);
            element.innerHTML = `
                <label class="component-type">${type.name}</label>
                <label>Name <input type="text" name="name" value="${name}" /></label>
            `;
            specs.forEach((parser, parameter) => {
                if (parameter.startsWith("*")) {
                    parameter = parameter.substring(1);
                }
                let capitalized = parameter.charAt(0).toUpperCase() + parameter.substring(1);
                let value = (data && parameter in data) ? JSON.stringify(data[parameter]) : "";
                element.innerHTML += `
                    <label>${capitalized} <input type="text" name="${parameter}" value='${value}' /></label>
                `;
            });
            element.querySelectorAll("input[type=text]").forEach(input => {
                if (input.getAttribute("name") != "name") {
                    input.addEventListener("change", function() {
                        thisEditor.updateEntry(name);
                    });
                }
            });
            this.componentEditorElement.appendChild(element);
        }
        {
            let element = document.createElement("div");
            element.classList.add("component");
            element.setAttribute("data-name", name);
            element.innerHTML = `
                <label class="component-type">${shortTypeName(type.name)}</label> <label>${name}</label>
            `;
            element.addEventListener("click", function() {
                thisEditor.clickComponent(this);
            });
            this.componentListElement.appendChild(element);
            element.scrollIntoView();
        }
        this.refresh();
    }
    clickComponent(componentElement: Element) {
        let name = componentElement.getAttribute("data-name");
        if (name != null) {
            this.selectComponent(name);
        }
    }
    selectComponent(name: string) {
        for (let element of this.componentEditorElement.children) {
            element.classList.toggle("selected", element.getAttribute("data-name") == name);
        }
    }
    updateEntry(name: string) {
        let element = this.componentEditorElement.querySelector(`.component-entry[data-name=${name}]`);
        if (element != null) {
            // Read data object
            let data = {};
            for (let input of element.querySelectorAll("input")) {
                let parameter = input.getAttribute("name")!;
                if (parameter == "name" || !input.value) {
                    continue;
                }
                try {
                    data[parameter] = JSON.parse(input.value);
                    input.classList.remove("invalid");
                } catch {
                    input.classList.add("invalid");
                    return;
                }
            }
            // Update in level
            this.level.updateComponent(name, data);
            this.refresh();
        }
    }
}


var editor = new LevelEditor();

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
        // Set up editor
        editor.componentListElement = document.querySelector("#editor #component-list")!;
        editor.componentEditorElement = document.querySelector("#editor #component-editor")!;
        {
            let typeSelector: HTMLSelectElement = document.querySelector("#editor #component-type")!;
            for (let typeName of LevelData.TYPENAME_TO_TYPE.keys()) {
                let element = document.createElement("option");
                element.setAttribute("value", typeName);
                element.innerText = typeName;
                typeSelector.appendChild(element);
            }
            let addComponentButton = document.querySelector("#editor #add-component")!;
            addComponentButton.addEventListener("click", () => {
                editor.createComponent(LevelData.TYPENAME_TO_TYPE.get(typeSelector.value)!);
            });
        }
        for (let name in simple_level) {
            let type = LevelData.TYPENAME_TO_TYPE.get(simple_level[name]["type"])!;
            editor.createComponent(type, name, simple_level[name]);
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
