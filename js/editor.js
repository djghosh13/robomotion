class LevelEditor extends Game {
    constructor() {
        super();
        this.level = new LevelData.Level({});
        this.camera = SCREEN_SIZE.div(2);
        this.mouseAnchor = null;
        this.playMode = false;
        this.componentGroups = new Map();
        this.componentListings = new Map();
        this.componentEditorEntries = new Map();
        // for (let component of this.level.constructLevel()[0]) {
        //     this.spawnObject(component);
        // }
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
                this.grabbedHandle = this.closestHandle();
                if (this.grabbedHandle != null) {
                    this.selectComponent(this.grabbedHandle[0]);
                }
                else {
                    this.mouseAnchor = MouseController.instance.getTarget();
                }
            }
            if (MouseController.instance.isGrabbing()) {
                if (this.grabbedHandle != null) {
                    let [name, parameter, index] = this.grabbedHandle;
                    let pointerPos = MouseController.instance.getTarget();
                    let newValue = [Math.round(pointerPos.x / 5) * 5, Math.round(pointerPos.y / 5) * 5];
                    let entry = this.componentEditorEntries.get(name);
                    if (entry != null) {
                        let inputElement = entry.querySelector(`input[name=${parameter}]`);
                        if (inputElement != null) {
                            if (index == -1) {
                                // Single point
                                inputElement.value = JSON.stringify(newValue);
                            }
                            else {
                                // Array of points
                                let array = Array.from(this.level.components.get(name).data[parameter]);
                                array[index] = newValue;
                                inputElement.value = JSON.stringify(array);
                            }
                        }
                        this.updateComponent(name);
                    }
                    else {
                        this.grabbedHandle = null;
                    }
                }
                else if (this.mouseAnchor != null) {
                    this.camera = this.camera.add(this.mouseAnchor.sub(MouseController.instance.getTarget()));
                }
            }
            else {
                this.grabbedHandle = null;
                this.mouseAnchor = null;
            }
            MouseController.instance.update(this);
            mouseJustPressed = false;
        }
    }
    render() {
        super.render();
        if (this.playMode) {
            return;
        }
        // Draw handles
        for (let [name, component] of this.level.components) {
            for (let [[parameter, index], value] of component.getHandles()) {
                let position = value.add(this.getCameraOffset());
                let held = this.grabbedHandle != null && this.grabbedHandle[0] == name
                    && this.grabbedHandle[1] == parameter && this.grabbedHandle[2] == index;
                this.ctx.strokeStyle = held ? "#93fc" : "#306c";
                this.ctx.fillStyle = held ? "c9f9" : "#93f6";
                this.ctx.lineWidth = held ? 3 : 2;
                this.ctx.beginPath();
                this.ctx.arc(position.x, position.y, held ? 6 : 5, 0, TWO_PI);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();
            }
        }
    }
    getCameraOffset() {
        if (this.playMode && this.searchComponents(Camera).length > 0) {
            return super.getCameraOffset();
        }
        return SCREEN_SIZE.div(2).sub(this.camera).floor();
    }
    closestHandle() {
        const THRESHOLD = 10;
        let closestHandle = null;
        let closestDistance = Number.POSITIVE_INFINITY;
        for (let [name, component] of this.level.components) {
            for (let [[parameter, index], value] of component.getHandles()) {
                let distance = value.sub(MouseController.instance.getTarget()).norm;
                if (distance < closestDistance) {
                    closestHandle = [name, parameter, index];
                    closestDistance = distance;
                }
            }
        }
        if (closestHandle != null && closestDistance < THRESHOLD) {
            return closestHandle;
        }
        return null;
    }
    getComponentGroup(typeName) {
        if (this.componentGroups.has(typeName)) {
            return this.componentGroups.get(typeName);
        }
        let element = document.createElement("div");
        element.classList.add("component-group");
        element.setAttribute("data-name", typeName);
        element.innerHTML = `
            <button class="group-heading">${typeName}</button>
        `;
        // Determine insertion order
        let nextName = null;
        for (let otherName of this.componentGroups.keys()) {
            if (typeName < otherName && (nextName == null || otherName < nextName)) {
                nextName = otherName;
            }
        }
        if (nextName != null) {
            this.componentListElement.insertBefore(element, this.componentGroups.get(nextName));
        }
        else {
            this.componentListElement.append(element);
        }
        element.querySelector(".group-heading").addEventListener("click", () => {
            element.classList.toggle("collapsed");
        });
        this.componentGroups.set(typeName, element);
        return element;
    }
    refresh() {
        // let fireworkManager = this.searchComponents<FireworkParticleManager>(FireworkParticleManager)[0]
        //     || new FireworkParticleManager();
        // Simple refresh: TODO
        while (this.components.length > 0) {
            this.destroyObject(this.components[0]);
        }
        let [components, errors] = this.level.constructLevel();
        for (let component of components) {
            this.spawnObject(component);
        }
        // this.spawnObject(fireworkManager);
        for (let [name, element] of this.componentListings) {
            let errored = errors.has(name);
            element.classList.toggle("invalid", errored);
            let editorElement = this.componentEditorEntries.get(name);
            editorElement.classList.toggle("invalid", errored);
            if (errored) {
                let parameter = errors.get(name)[1];
                editorElement.querySelector(`input[name=${parameter}]`)?.classList.add("invalid");
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
            for (let [parameter, [parser]] of specs) {
                let capitalized = parameter.charAt(0).toUpperCase() + parameter.substring(1);
                let value = (data && parameter in data) ? JSON.stringify(data[parameter]) : "";
                element.innerHTML += `
                <label>${capitalized} <input type="text" name="${parameter}" value='${value}' /></label>
                `;
            }
            element.querySelector("button.remove").addEventListener("dblclick", () => {
                thisEditor.removeComponent(name);
            });
            element.querySelectorAll("input[type=text]").forEach(input => {
                if (input.getAttribute("name") == "name") {
                    input.addEventListener("change", function () {
                        thisEditor.renameComponent(name);
                    });
                }
                else {
                    input.addEventListener("change", function () {
                        thisEditor.updateComponent(name);
                    });
                }
            });
            this.componentEditorElement.append(element);
            this.componentEditorEntries.set(name, element);
        }
        // List element (type and name only)
        {
            let element = document.createElement("div");
            element.classList.add("component");
            element.setAttribute("data-name", name);
            element.setAttribute("data-group", type.name);
            element.innerHTML = `
                <label class="component-type">${shortTypeName(type.name)}</label>
                <label class="component-name">${name}</label>
            `;
            element.addEventListener("click", function () {
                thisEditor.clickComponent(this);
            });
            this.getComponentGroup(type.name).append(element);
            this.componentListings.set(name, element);
            this.selectComponent(name);
        }
        this.refresh();
    }
    removeComponent(name) {
        this.componentEditorEntries.get(name)?.remove();
        this.componentEditorEntries.delete(name);
        this.componentListings.get(name)?.remove();
        this.componentListings.delete(name);
        for (let [typeName, element] of this.componentGroups) {
            // TODO: Less hacky
            if (element.querySelectorAll(".component").length == 0) {
                element.remove();
                this.componentGroups.delete(typeName);
            }
        }
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
        if (name != null) {
            let listing = this.componentListings.get(name);
            if (listing != null) {
                let groupName = listing.getAttribute("data-group");
                if (groupName != null) {
                    this.componentGroups.get(groupName)?.classList.remove("collapsed");
                }
                listing.scrollIntoView({ block: "nearest" });
            }
        }
        for (let [eName, element] of this.componentEditorEntries) {
            element.classList.toggle("selected", eName == name);
        }
    }
    updateComponent(name) {
        let element = this.componentEditorEntries.get(name);
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
    renameComponent(name) {
        let element = this.componentEditorEntries.get(name);
        if (element != null) {
            let nameInput = element.querySelector("input[name=name]");
            let newName = nameInput.value;
            if (newName == name) {
                nameInput.classList.remove("invalid");
                return;
            }
            if (!newName || this.componentListings.has(newName)) {
                nameInput.classList.add("invalid");
                return;
            }
            nameInput.classList.remove("invalid");
            // Update in level
            let parameterUpdates = this.level.renameComponent(name, newName);
            console.log(parameterUpdates);
            // HTML updates
            for (let [componentName, parameter] of parameterUpdates) {
                let dependent = this.componentEditorEntries.get(componentName);
                let parameterInput = dependent.querySelector(`input[name=${parameter}]`);
                if (parameterInput != null) {
                    parameterInput.value = `"${newName}"`;
                }
            }
            let listing = this.componentListings.get(name);
            listing.setAttribute("data-name", newName);
            listing.querySelector(".component-name").innerHTML = newName;
            let entry = this.componentEditorEntries.get(name);
            entry.setAttribute("data-name", newName);
            // Reference updates
            this.componentListings.delete(name);
            this.componentListings.set(newName, listing);
            this.componentEditorEntries.delete(name);
            this.componentEditorEntries.set(newName, entry);
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
                    debugCoords.innerText = `(${Math.round(mousePos.x / 5) * 5}, ${Math.round(mousePos.y / 5) * 5})`;
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
            for (let typeName of Array.from(LevelData.TYPENAME_TO_TYPE.keys()).sort()) {
                let element = document.createElement("option");
                element.setAttribute("value", typeName);
                element.innerText = typeName;
                typeSelector.append(element);
            }
            let addComponentButton = document.querySelector("#editor #add-component");
            addComponentButton.addEventListener("click", () => {
                editor.createComponent(LevelData.TYPENAME_TO_TYPE.get(typeSelector.value));
            });
        }
        document.querySelector("#play-toggle")?.addEventListener("click", () => {
            editor.playMode = !editor.playMode;
        });
        // TODO: Make level loading official
        for (let name in simple_level) {
            let type = LevelData.TYPENAME_TO_TYPE.get(simple_level[name]["type"]);
            editor.createComponent(type, name, simple_level[name]);
        }
        editor.selectComponent();
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
