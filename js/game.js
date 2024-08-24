class Game {
    constructor() {
        this.components = [];
        this.robotArms = [];
        this.spawnObject(MouseController.instance);
    }
    update() {
        // Update components
        for (let comp of this.components) {
            comp.update(this);
        }
        mouseJustPressed = false;
    }
    render() {
        setup(this.ctx);
        // Get held objects
        let heldObjects = new Set();
        for (let robotArm of this.robotArms) {
            if (robotArm.heldObject != null) {
                heldObjects.add(robotArm.heldObject);
            }
        }
        // Get correct render order
        let renderOrdering = [...this.components].sort((a, b) => a.renderOrder - b.renderOrder);
        let preIndex = renderOrdering.reduce((splitIndex, comp, curIndex) => (comp.renderOrder < 0) ? curIndex + 1 : splitIndex, 0);
        let postIndex = renderOrdering.reduce((splitIndex, comp, curIndex) => (comp.renderOrder > 0) ? splitIndex : curIndex + 1, 0);
        // Draw background (negative renderOrder)
        for (let i = 0; i < preIndex; i++) {
            if (!heldObjects.has(renderOrdering[i])) {
                renderOrdering[i].render(this.ctx);
            }
        }
        // Draw robot arms
        for (let robotArm of this.searchComponents(RobotArm)) {
            // Draw base arm
            robotArm.render(this.ctx);
            // Draw held object
            if (robotArm.heldObject != null && heldObjects.has(robotArm.heldObject)) {
                robotArm.heldObject.render(this.ctx);
            }
            // Draw grabber arm
            robotArm.grabber.renderGrabber(this.ctx);
        }
        // Draw foreground (positive renderOrder)
        for (let i = postIndex; i < renderOrdering.length; i++) {
            if (!heldObjects.has(renderOrdering[i])) {
                renderOrdering[i].render(this.ctx);
            }
        }
    }
    searchComponents(cls) {
        return this.components.filter(function (x) {
            return x instanceof cls;
        });
    }
    heldBy(object) {
        let holders = [];
        for (let robotArm of this.robotArms) {
            if (robotArm.heldObject == object) {
                holders.push(robotArm);
            }
        }
        return holders;
    }
    spawnObject(object) {
        this.components.push(object);
        if (object instanceof RobotArm) {
            this.robotArms.push(object);
        }
    }
    destroyObject(object) {
        let index = this.components.indexOf(object);
        if (index != -1) {
            this.components.splice(index, 1);
            if (iofIGrabbable(object)) {
                for (let robotArm of this.heldBy(object)) {
                    robotArm.heldObject = null;
                }
            }
        }
        if (object instanceof RobotArm) {
            let index = this.robotArms.indexOf(object);
            if (index != -1) {
                this.robotArms.splice(index, 1);
            }
        }
    }
}
