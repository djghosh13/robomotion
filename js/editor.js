class LevelEditor extends Game {
    constructor() {
        super();
        this.level = new LevelData.Level({});
        this.camera = SCREEN_SIZE.div(2);
        this.mouseAnchor = null;
        this.playMode = false;
        for (let component of this.level.constructLevel()[0]) {
            this.spawnObject(component);
        }
    }
    update() {
        if (this.playMode) {
            this.searchComponents(RobotArm).forEach(robotArm => robotArm.controller = MouseController.instance);
            MouseController.instance.update(this);
            super.update();
            return;
        }
        else {
            if (MouseController.instance.justGrabbed()) {
                this.mouseAnchor = MouseController.instance.getTarget();
            }
            if (MouseController.instance.isGrabbing() && this.mouseAnchor != null) {
                this.camera = this.camera.add(this.mouseAnchor.sub(MouseController.instance.getTarget()));
            }
            else {
                this.mouseAnchor = null;
            }
            MouseController.instance.update(this);
            mouseJustPressed = false;
        }
    }
    getCameraOffset() {
        if (this.playMode && this.searchComponents(Camera).length > 0) {
            return super.getCameraOffset();
        }
        return SCREEN_SIZE.div(2).sub(this.camera).floor();
    }
    getComponentElement(name) {
        return this.componentListElement.querySelector(`.component[data-name=${name}]`);
    }
    getComponentEditorElement(name) {
        return this.componentEditorElement.querySelector(`.component-entry[data-name=${name}]`);
    }
    getAllComponentElements() {
        let elements = new Map();
        this.componentListElement.querySelectorAll(`.component[data-name]`).forEach(element => {
            elements.set(element.getAttribute("data-name"), element);
        });
        return elements;
    }
    getAllComponentEditorElements() {
        let elements = new Map();
        this.componentEditorElement.querySelectorAll(`.component-entry[data-name]`).forEach(element => {
            elements.set(element.getAttribute("data-name"), element);
        });
        return elements;
    }
    refresh() {
        // Simple refresh: TODO
        while (this.components.length > 0) {
            this.destroyObject(this.components[0]);
        }
        let [components, errors] = this.level.constructLevel();
        for (let component of components) {
            this.spawnObject(component);
        }
        for (let [name, element] of this.getAllComponentElements()) {
            let errored = errors.has(name);
            element.classList.toggle("invalid", errored);
            let editorElement = this.getComponentEditorElement(name);
            if (editorElement != null) {
                editorElement.classList.toggle("invalid", errored);
                if (errored) {
                    let parameter = errors.get(name)[1];
                    editorElement.querySelector(`input[name=${parameter}]`)?.classList.add("invalid");
                }
            }
        }
    }
    createComponent(type, name, data) {
        const thisEditor = this;
        function shortTypeName(typeName) {
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
        let specs = LevelData.OBJECT_REGISTRY.get(type);
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
        // Editor element (all properties, editable)
        {
            let element = document.createElement("div");
            element.classList.add("component-entry");
            element.setAttribute("data-name", name);
            element.innerHTML = `
                <label class="component-type">${type.name}</label>
                <label>Name <input type="text" name="name" value="${name}" /></label>
                <button class="remove" title="Double-click to remove">Remove</button>
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
            element.querySelector("button.remove").addEventListener("dblclick", () => {
                thisEditor.removeComponent(name);
            });
            element.querySelectorAll("input[type=text]").forEach(input => {
                if (input.getAttribute("name") != "name") {
                    input.addEventListener("change", function () {
                        thisEditor.updateComponent(name);
                    });
                }
            });
            this.componentEditorElement.appendChild(element);
        }
        // List element (type and name only)
        {
            let element = document.createElement("div");
            element.classList.add("component");
            element.setAttribute("data-name", name);
            element.innerHTML = `
                <label class="component-type">${shortTypeName(type.name)}</label> <label>${name}</label>
            `;
            element.addEventListener("click", function () {
                thisEditor.clickComponent(this);
            });
            this.componentListElement.appendChild(element);
            element.scrollIntoView();
        }
        this.refresh();
    }
    removeComponent(name) {
        this.getComponentEditorElement(name)?.remove();
        this.getComponentElement(name)?.remove();
        this.level.removeComponent(name);
        this.refresh();
    }
    clickComponent(componentElement) {
        let name = componentElement.getAttribute("data-name");
        if (name != null) {
            this.selectComponent(name);
        }
    }
    selectComponent(name) {
        for (let [elementName, element] of this.getAllComponentEditorElements()) {
            element.classList.toggle("selected", elementName == name);
        }
    }
    updateComponent(name) {
        let element = this.getComponentEditorElement(name);
        if (element != null) {
            // Read data object
            let data = {};
            for (let input of element.querySelectorAll("input")) {
                let parameter = input.getAttribute("name");
                if (parameter == "name" || !input.value) {
                    continue;
                }
                try {
                    data[parameter] = JSON.parse(input.value);
                    input.classList.remove("invalid");
                }
                catch {
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
var spfHistory = Array(60).fill(FRAME_INTERVAL);
var msptHistory = Array(60).fill(0);
var averageSPF = FRAME_INTERVAL;
var averageMSPT = 0;
var lastFrame = Date.now();
function editorUpdate(ctx) {
    if (!run)
        return;
    let startTime = Date.now();
    editor.update();
    editor.render();
    let endTime = Date.now();
    let spf = endTime - lastFrame;
    let mspt = endTime - startTime;
    lastFrame = endTime;
    spfHistory.push(spf);
    msptHistory.push(mspt);
    averageSPF += (spf - spfHistory.shift()) / spfHistory.length;
    averageMSPT += (mspt - msptHistory.shift()) / msptHistory.length;
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
document.onreadystatechange = function (event) {
    if (document.readyState == "complete") {
        // Set up canvas
        let canvas = document.querySelector("#simulation");
        if (canvas instanceof HTMLCanvasElement) {
            let context = canvas.getContext("2d");
            editor.ctx = context;
            window.setInterval(editorUpdate, FRAME_INTERVAL, context);
            canvas.addEventListener("mousemove", event => {
                mousePosition = new Vector(event.offsetX, event.offsetY);
                let debugCoords = document.querySelector("#mouse-coords");
                if (debugCoords != null) {
                    let mousePos = MouseController.instance.getTarget();
                    debugCoords.innerText = `(${mousePos.x.toFixed(0)}, ${mousePos.y.toFixed(0)})`;
                }
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
        // Set up editor
        editor.componentListElement = document.querySelector("#editor #component-list");
        editor.componentEditorElement = document.querySelector("#editor #component-editor");
        {
            let typeSelector = document.querySelector("#editor #component-type");
            for (let typeName of LevelData.TYPENAME_TO_TYPE.keys()) {
                let element = document.createElement("option");
                element.setAttribute("value", typeName);
                element.innerText = typeName;
                typeSelector.appendChild(element);
            }
            let addComponentButton = document.querySelector("#editor #add-component");
            addComponentButton.addEventListener("click", () => {
                editor.createComponent(LevelData.TYPENAME_TO_TYPE.get(typeSelector.value));
            });
        }
        document.querySelector("#play-toggle")?.addEventListener("click", () => {
            editor.playMode = !editor.playMode;
        });
        for (let name in simple_level) {
            let type = LevelData.TYPENAME_TO_TYPE.get(simple_level[name]["type"]);
            editor.createComponent(type, name, simple_level[name]);
        }
        // Debug
        document.addEventListener("keydown", event => {
            if (event.key.toLowerCase() == "f") {
                let debug = document.querySelector("#debug-fps");
                if (debug != null) {
                    debug.style['display'] = (debug.style['display'] == "none") ? "block" : "none";
                }
            }
            if (event.key.toLowerCase() == "c") {
                if (event.ctrlKey) {
                    navigator.clipboard.writeText(editor.level.export());
                }
                else {
                    let debug = document.querySelector("#debug-coords");
                    if (debug != null) {
                        debug.style['display'] = (debug.style['display'] == "none") ? "block" : "none";
                    }
                }
            }
        });
    }
};
