class Game {
    public ctx: CanvasRenderingContext2D;
    public components: IComponent[];
    public robotArms: RobotArm[];
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
        this.ctx.save();
        setup(this.ctx);
        // Adjust for camera
        let camera = this.getCamera();
        if (camera != null) {
            let offset = SCREEN_SIZE.div(2).sub(camera.position);
            this.ctx.translate(offset.x, offset.y);
        }
        // Get held objects
        let specialObjects = new Set<IComponent>();
        for (let robotArm of this.robotArms) {
            if (robotArm.heldObject != null) {
                specialObjects.add(robotArm.heldObject);
            }
        }
        let fireworkManagers = this.searchComponents<FireworkParticleManager>(FireworkParticleManager);
        for (let fireworkManager of fireworkManagers) {
            specialObjects.add(fireworkManager);
        }
        // Get correct render order
        let renderOrdering = [...this.components].sort((a, b) => a.renderOrder - b.renderOrder);
        let preIndex = renderOrdering.reduce(
            (splitIndex, comp, curIndex) => (comp.renderOrder < 0) ? curIndex + 1 : splitIndex,
            0
        );
        let postIndex = renderOrdering.reduce(
            (splitIndex, comp, curIndex) => (comp.renderOrder > 0) ? splitIndex : curIndex + 1,
            0
        );
        // Draw background (negative renderOrder)
        for (let i = 0; i < preIndex; i++) {
            if (!specialObjects.has(renderOrdering[i])) {
                renderOrdering[i].render(this.ctx);
            }
        }
        // Draw robot arms
        for (let robotArm of this.searchComponents<RobotArm>(RobotArm)) {
            // Draw base arm
            robotArm.render(this.ctx);
            // Draw held object
            if (robotArm.heldObject != null && specialObjects.has(robotArm.heldObject)) {
                robotArm.heldObject.render(this.ctx);
            }
            // Draw grabber arm
            robotArm.grabber.renderGrabber(this.ctx);
        }
        // Draw foreground (positive renderOrder)
        for (let i = postIndex; i < renderOrdering.length; i++) {
            if (!specialObjects.has(renderOrdering[i])) {
                renderOrdering[i].render(this.ctx);
            }
        }
        this.ctx.restore();
        // Draw fireworks (shader)
        for (let fireworkManager of fireworkManagers) {
            fireworkManager.render(this.ctx);
        }
    }
    searchComponents<Type extends IComponent>(cls: any): Type[] {
        return this.components.filter(function (x): x is Type {
            return x instanceof cls;
        });
    }
    getCamera(): Camera | null {
        let cameras = this.searchComponents<Camera>(Camera);
        if (cameras.length > 0) {
            return cameras[0];
        }
        return null;
    }
    heldBy(object: IComponent & IGrabbable): RobotArm[] {
        let holders: RobotArm[] = [];
        for (let robotArm of this.robotArms) {
            if (robotArm.heldObject == object) {
                holders.push(robotArm);
            }
        }
        return holders;
    }
    spawnObject(object: IComponent) {
        this.components.push(object);
        if (object instanceof RobotArm) {
            this.robotArms.push(object);
        }
    }
    destroyObject(object: IComponent) {
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