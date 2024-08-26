var LevelData;
(function (LevelData) {
    // Data types
    class Data {
    }
    class NumberData extends Data {
        constructor(min, max, step) {
            super();
            this.min = min;
            this.max = max;
            this.step = step;
        }
        parse(data) {
            let value = Number(data);
            if (Number.isNaN(value) || value < this.min || value > this.max) {
                throw ["invalid", data];
            }
            return value;
        }
    }
    class VectorData extends Data {
        parse(data) {
            try {
                let x = Number(data[0]);
                let y = Number(data[1]);
                if (Number.isNaN(x) || Number.isNaN(y)) {
                    throw NaN;
                }
                return new Vector(x, y);
            }
            catch {
                throw ["invalid", data];
            }
        }
    }
    class PointData extends VectorData {
    }
    class FireworkElementData extends Data {
        parse(data) {
            try {
                let value = FireworkElement[data];
                if (FireworkElement[value] != String(data)) {
                    throw data;
                }
                return value;
            }
            catch {
                throw ["invalid", data];
            }
        }
    }
    class BoneGraphicsData extends Data {
        parse(data) {
            return buildArmGraphics({
                root: [0, 0],
                bones: data
            });
        }
    }
    class ObjectData extends Data {
        constructor(typeCheck) {
            super();
            this.typeCheck = typeCheck;
        }
        parse(data, components) {
            let index = data;
            let object = components.get(index);
            if (this.typeCheck == null || this.typeCheck(object)) {
                return object;
            }
            throw ["invalid", data];
        }
    }
    class ArrayData extends Data {
        constructor(item) {
            super();
            this.item = item;
        }
        parse(data, components) {
            try {
                let array = [];
                for (let i = 0; i < data.length; i++) {
                    array.push(this.item.parse(data[i], components));
                }
                return array;
            }
            catch {
                throw ["invalid", data];
            }
        }
    }
    // Data type instances
    const PARAMETER_TYPE = {
        POSITIVE_FLOAT: new NumberData(0, Number.POSITIVE_INFINITY, null),
        POSITIVE_INT: new NumberData(1, Number.POSITIVE_INFINITY, 1),
        DEGREE_ANGLE: new NumberData(0, 360, 1),
        POINT: new PointData(),
        VECTOR: new VectorData(),
    };
    const OBJECT_REGISTRY = new Map([
        // Obstacle
        [SimpleObstacle, new Map([
                ["points", new ArrayData(new PointData())],
            ])],
        // Interactibles
        [Button, new Map([
                ["position", PARAMETER_TYPE.POINT],
                ["facing", PARAMETER_TYPE.VECTOR],
                ["*speed", PARAMETER_TYPE.POSITIVE_FLOAT],
                ["*width", PARAMETER_TYPE.POSITIVE_FLOAT],
                ["*depth", PARAMETER_TYPE.POSITIVE_FLOAT],
                ["*minDepth", PARAMETER_TYPE.POSITIVE_FLOAT],
            ])],
        [ChainPull, new Map([
                ["position", PARAMETER_TYPE.POINT],
                ["*speed", PARAMETER_TYPE.POSITIVE_FLOAT],
                ["*length", PARAMETER_TYPE.POSITIVE_FLOAT],
                ["*maxLength", PARAMETER_TYPE.POSITIVE_FLOAT],
            ])],
        [Lever, new Map([
                ["position", PARAMETER_TYPE.POINT],
                ["facing", PARAMETER_TYPE.VECTOR],
                ["*speed", PARAMETER_TYPE.POSITIVE_FLOAT],
                ["*length", PARAMETER_TYPE.POSITIVE_FLOAT],
                ["*maxRotation", PARAMETER_TYPE.DEGREE_ANGLE],
            ])],
        // Lights
        [Light, new Map([
                ["position", PARAMETER_TYPE.POINT],
                ["*hue", PARAMETER_TYPE.DEGREE_ANGLE],
            ])],
        [WireLight, new Map([
                ["points", new ArrayData(PARAMETER_TYPE.POINT)],
                ["*hue", PARAMETER_TYPE.DEGREE_ANGLE],
            ])],
        [CounterLight, new Map([
                ["position", PARAMETER_TYPE.POINT],
                ["maxCount", PARAMETER_TYPE.POSITIVE_INT],
                ["*hue", PARAMETER_TYPE.DEGREE_ANGLE],
            ])],
        // Firework related
        [FireworkSpawner, new Map([
                ["position", PARAMETER_TYPE.POINT],
                ["maxFireworks", PARAMETER_TYPE.POSITIVE_INT],
                ["capacity", PARAMETER_TYPE.POSITIVE_INT],
                ["elements", new ArrayData(new FireworkElementData())],
            ])],
        [FireworkFiller, new Map([
                ["position", PARAMETER_TYPE.POINT],
                ["element", new FireworkElementData()],
                ["time", PARAMETER_TYPE.POSITIVE_FLOAT],
                ["topLeft", PARAMETER_TYPE.POINT],
                ["bottomRight", PARAMETER_TYPE.POINT],
                ["*radius", PARAMETER_TYPE.POSITIVE_FLOAT],
                ["*speed", PARAMETER_TYPE.POSITIVE_FLOAT],
            ])],
        [FireworkPreparer, new Map([
                ["position", PARAMETER_TYPE.POINT],
                ["*radius", PARAMETER_TYPE.POSITIVE_FLOAT],
                ["*speed", PARAMETER_TYPE.POSITIVE_FLOAT],
            ])],
        [FireworkLauncher, new Map([
                ["position", PARAMETER_TYPE.POINT],
                ["*radius", PARAMETER_TYPE.POSITIVE_FLOAT],
                ["*speed", PARAMETER_TYPE.POSITIVE_FLOAT],
            ])],
        // Circuits
        [AlwaysOn, new Map([])],
        [SimpleCircuit, new Map([
                ["activator", new ObjectData(iofIOutputter)],
                ["responder", new ObjectData(iofIInputter)],
            ])],
        [ActivatorCircuit, new Map([
                ["activator", new ObjectData(iofIOutputter)],
                ["responder", new ObjectData(iofIInputter)],
                ["cooldown", PARAMETER_TYPE.POSITIVE_FLOAT],
            ])],
        // Robot arm
        [Carrier, new Map([
                ["robotArm", new ObjectData(object => object instanceof RobotArm)],
                ["positions", new ArrayData(PARAMETER_TYPE.POINT)],
                ["*speed", PARAMETER_TYPE.POSITIVE_FLOAT],
            ])],
        [Camera, new Map([
                ["target", new ObjectData(object => object instanceof RobotArm)],
                ["*stiffness", PARAMETER_TYPE.POSITIVE_FLOAT],
                ["*damping", PARAMETER_TYPE.POSITIVE_FLOAT],
            ])],
        [RobotArm, new Map([
                ["armature", new BoneGraphicsData()],
            ])],
    ]);
    var TYPENAME_TO_TYPE = new Map();
    for (let key of OBJECT_REGISTRY.keys()) {
        TYPENAME_TO_TYPE.set(key.name, key);
    }
    class ComponentConstructor {
        constructor(type, data) {
            this.type = type;
            this.data = data;
            this.specs = OBJECT_REGISTRY.get(type);
            this.references = new Set();
            this.specs.forEach((parser, parameter) => {
                if (parameter.startsWith("*")) {
                    parameter = parameter.substring(1);
                }
                if (parser instanceof ObjectData) {
                    this.references.add(parameter);
                }
            });
        }
        getDependencies() {
            let dependencies = [];
            this.references.forEach(parameter => {
                if (parameter in this.data) {
                    dependencies.push(this.data[parameter]);
                }
            });
            return dependencies;
        }
        createComponent(components) {
            let positionalArgs = [null];
            let keywordArgs = {};
            let hasKeywordArgs = false;
            this.specs.forEach((parser, parameter) => {
                let keyword = false;
                if (parameter.startsWith("*")) {
                    parameter = parameter.substring(1);
                    keyword = true;
                    hasKeywordArgs = true;
                }
                if (parameter in this.data) {
                    if (keyword) {
                        keywordArgs[parameter] = parser.parse(this.data[parameter], components);
                    }
                    else {
                        positionalArgs.push(parser.parse(this.data[parameter], components));
                    }
                }
                else if (!keyword) {
                    throw ["missing", parameter];
                }
            });
            if (hasKeywordArgs) {
                positionalArgs.push(keywordArgs);
            }
            let constructor = this.type.bind.apply(this.type, positionalArgs);
            return new constructor();
        }
    }
    class Level {
        constructor(data) {
            this.components = new Map();
            for (let name in data) {
                let typeName = data[name]["type"];
                let type = TYPENAME_TO_TYPE.get(typeName);
                this.components.set(name, new ComponentConstructor(type, data[name]));
            }
        }
        updateParameter(name, parameter, value) {
            // TODO
        }
        constructLevel() {
            let builtComponents = new Map();
            for (let name of this.topologicalSort()) {
                builtComponents.set(name, this.components.get(name).createComponent(builtComponents));
            }
            let orderedComponents = [];
            for (let name of this.components.keys()) {
                orderedComponents.push(builtComponents.get(name));
            }
            return orderedComponents;
        }
        topologicalSort() {
            // Get start nodes and dependencies
            let nodeQueue = [];
            let dependents = new Map();
            let dependencies = new Map();
            this.components.forEach((component, name) => {
                if (component.references.size == 0) {
                    nodeQueue.push(name);
                }
                else {
                    dependencies.set(name, new Set(component.getDependencies()));
                }
                dependents.set(name, new Set());
            });
            dependencies.forEach((deps, name) => {
                deps.forEach(dep => {
                    if (dependents.has(dep)) {
                        dependents.get(dep).add(name);
                    }
                    else {
                        throw ["reference", dep];
                    }
                });
            });
            // Kahn's algorithm
            let sortedComponents = [];
            while (nodeQueue.length > 0) {
                let node = nodeQueue.shift();
                sortedComponents.push(node);
                dependents.get(node).forEach(dependent => {
                    let remainingDeps = dependencies.get(dependent);
                    remainingDeps.delete(node);
                    if (remainingDeps.size == 0) {
                        nodeQueue.push(dependent);
                        dependencies.delete(dependent);
                    }
                });
            }
            if (dependencies.size > 0) {
                // Circular dependencies
                throw ["circular", null];
            }
            return sortedComponents;
        }
    }
    LevelData.Level = Level;
})(LevelData || (LevelData = {}));
const simple_level = {
    // Robot arm
    "robot0": {
        "type": "RobotArm",
        "armature": [
            { length: 110, speed: 3, width: 30 },
            { length: 80, speed: 5, width: 20 },
            { length: 60, speed: 6, width: 20 },
            { length: 45, speed: 5, width: 18 }
        ]
    },
    "carrier0": {
        "type": "Carrier",
        "robotArm": "robot0",
        "positions": [
            [280, 380],
            [580, 415]
        ],
        "speed": 200
    },
    "camera0": {
        "type": "Camera",
        "target": "robot0"
    },
    // Interactibles
    "button0": {
        "type": "Button",
        "position": [115, 280],
        "facing": [0, 1],
        "speed": 2,
        "width": 60,
        "depth": 20
    },
    "button1": {
        "type": "Button",
        "position": [445, 280],
        "facing": [0, 1],
        "speed": 2,
        "width": 60,
        "depth": 20
    },
    "button_spawn": {
        "type": "Button",
        "position": [110, 565],
        "facing": [1, 0],
        "speed": 1.5,
        "width": 40,
        "depth": 15
    },
    "chainpull0": {
        "type": "ChainPull",
        "position": [280, 40],
        "speed": 2,
        "length": 85,
        "maxLength": 125
    },
    "chainpull1": {
        "type": "ChainPull",
        "position": [650, 40],
        "speed": 2,
        "length": 100,
        "maxLength": 140
    },
    "lever0": {
        "type": "Lever",
        "position": [515, 645],
        "facing": [-1, 0],
        "speed": 2,
        "length": 50,
        "maxRotation": 45
    },
    // Fireworks
    "fireworkfiller0": {
        "type": "FireworkFiller",
        "position": [115, 175],
        "element": "COPPER",
        "time": 1.5,
        "topLeft": [75, 100],
        "bottomRight": [155, 230],
        "radius": 40
    },
    "fireworkfiller1": {
        "type": "FireworkFiller",
        "position": [445, 175],
        "element": "STRONTIUM",
        "time": 2.5,
        "topLeft": [405, 100],
        "bottomRight": [485, 230],
        "radius": 40
    },
    "fireworkpreparer0": {
        "type": "FireworkPreparer",
        "position": [590, 630],
        "radius": 40
    },
    "fireworklauncher0": {
        "type": "FireworkLauncher",
        "position": [820, 540],
        "radius": 40
    },
    "fireworkspawner0": {
        "type": "FireworkSpawner",
        "position": [50, 490],
        "maxFireworks": 2,
        "capacity": 4,
        "elements": []
    },
    // Lights
    "wirelight0": {
        "type": "WireLight",
        "points": [
            [530, 660],
            [650, 660],
            [650, 630],
            [530, 630],
            [530, 600],
            [650, 600]
        ],
        "hue": 200
    },
    "light0": {
        "type": "Light",
        "position": [115, 50]
    },
    "light1": {
        "type": "Light",
        "position": [445, 50]
    },
    "light_spawn": {
        "type": "Light",
        "position": [50, 565],
        "hue": 5
    },
    "counterlight_spawn": {
        "type": "CounterLight",
        "position": [50, 415],
        "maxCount": 2
    },
    // Circuits
    "alwayson0": {
        "type": "AlwaysOn"
    },
    "simplecircuit0": {
        "type": "SimpleCircuit",
        "activator": "button0",
        "responder": "light0"
    },
    "simplecircuit1": {
        "type": "SimpleCircuit",
        "activator": "button1",
        "responder": "light1"
    },
    "simplecircuit_spawn": {
        "type": "SimpleCircuit",
        "activator": "button_spawn",
        "responder": "light_spawn"
    },
    "simplecircuit_chain0": {
        "type": "SimpleCircuit",
        "activator": "chainpull0",
        "responder": "carrier0"
    },
    "simplecircuit_chain1": {
        "type": "SimpleCircuit",
        "activator": "chainpull1",
        "responder": "carrier0"
    },
    "simplecircuit_lever0": {
        "type": "SimpleCircuit",
        "activator": "lever0",
        "responder": "wirelight0"
    },
    "activatorcircuit_spawn": {
        "type": "ActivatorCircuit",
        "activator": "button_spawn",
        "responder": "fireworkspawner0",
        "cooldown": 1
    },
    "activatorcircuit0": {
        "type": "ActivatorCircuit",
        "activator": "button0",
        "responder": "fireworkfiller0",
        "cooldown": 1
    },
    "activatorcircuit1": {
        "type": "ActivatorCircuit",
        "activator": "button1",
        "responder": "fireworkfiller1",
        "cooldown": 1
    },
    "activatorcircuit_lever0": {
        "type": "ActivatorCircuit",
        "activator": "lever0",
        "responder": "fireworkpreparer0",
        "cooldown": 1
    },
    "simplecircuit_launch": {
        "type": "SimpleCircuit",
        "activator": "alwayson0",
        "responder": "fireworklauncher0"
    },
    "simplecircuit_count": {
        "type": "SimpleCircuit",
        "activator": "fireworkspawner0",
        "responder": "counterlight_spawn"
    },
    // Obstacles
    "obstacle0": {
        "type": "SimpleObstacle",
        "points": [
            [70, 0], [70, 100],
            [160, 100], [160, 0]
        ]
    },
    "obstacle1": {
        "type": "SimpleObstacle",
        "points": [
            [80, 250], [80, 280],
            [150, 280], [150, 250]
        ]
    },
    "obstacle2": {
        "type": "SimpleObstacle",
        "points": [
            [70, 230], [70, 250], [100, 270],
            [130, 270], [160, 250], [160, 230]
        ]
    },
    "obstacle3": {
        "type": "SimpleObstacle",
        "points": [
            [400, 0], [400, 100],
            [490, 100], [490, 0]
        ]
    },
    "obstacle4": {
        "type": "SimpleObstacle",
        "points": [
            [410, 250], [410, 280],
            [480, 280], [480, 250]
        ]
    },
    "obstacle5": {
        "type": "SimpleObstacle",
        "points": [
            [400, 230], [400, 250], [430, 270],
            [460, 270], [490, 250], [490, 230]
        ]
    },
    "obstacle6": {
        "type": "SimpleObstacle",
        "points": [
            [250, 0], [250, 40],
            [310, 40], [310, 0],
        ]
    },
    "obstacle7": {
        "type": "SimpleObstacle",
        "points": [
            [620, 0], [620, 40],
            [680, 40], [680, 0],
        ]
    },
    "obstacle8": {
        "type": "SimpleObstacle",
        "points": [
            [0, 400], [100, 400],
            [100, 430], [0, 430],
        ]
    },
    "obstacle9": {
        "type": "SimpleObstacle",
        "points": [
            [80, 540], [110, 540],
            [110, 590], [80, 590],
        ]
    },
    "obstacle10": {
        "type": "SimpleObstacle",
        "points": [
            [0, 525], [100, 525],
            [100, 600], [0, 600],
        ]
    },
    "obstacle11": {
        "type": "SimpleObstacle",
        "points": [
            [530, 720], [530, 680],
            [650, 680], [650, 720],
        ]
    },
    "obstacle12": {
        "type": "SimpleObstacle",
        "points": [
            [520, 720], [520, 580],
            [540, 580], [540, 720],
        ]
    },
    "obstacle13": {
        "type": "SimpleObstacle",
        "points": [
            [640, 720], [640, 580],
            [660, 580], [660, 720],
        ]
    },
    "obstacle14": {
        "type": "SimpleObstacle",
        "points": [
            [770, 460], [870, 460],
            [870, 495], [770, 495],
        ]
    },
    "obstacle15": {
        "type": "SimpleObstacle",
        "points": [
            [770, 580], [870, 580],
            [870, 615], [820, 625], [770, 615],
        ]
    },
    "obstacle16": {
        "type": "SimpleObstacle",
        "points": [
            [0, 525], [100, 525],
            [100, 600], [0, 600],
        ]
    },
    "obstacle17": {
        "type": "SimpleObstacle",
        "points": [
            [520, 620], [510, 620],
            [510, 670], [520, 670],
        ]
    },
};
