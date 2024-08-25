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
        // Adjust for camera
        let cameraOffset = this.getCameraOffset();
        this.defaultGraphics();
        this.renderBackground(cameraOffset);
        this.ctx.translate(cameraOffset.x, cameraOffset.y);
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
    defaultGraphics() {
        this.ctx.lineWidth = 10;
        this.ctx.lineJoin = "bevel";
        this.ctx.strokeStyle = "white";
        this.ctx.fillStyle = "white";
        this.ctx.lineCap = "round";
    }
    renderBackground(cameraOffset: Vector) {
        this.ctx.fillStyle = "hsl(264, 30%, 5%)";
        this.ctx.beginPath();
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.ctx.closePath();
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = "#222";
        const GRID_SIZE = 50;
        let xo = (cameraOffset.x % GRID_SIZE + GRID_SIZE) % GRID_SIZE;
        for (let xi = 0; xi < Math.ceil(SCREEN_SIZE.x / GRID_SIZE); xi++) {
            // this.ctx.strokeStyle = (x % 50 == 0) ? "#222" : "#111";
            this.ctx.beginPath();
            this.ctx.moveTo(xi * GRID_SIZE + xo, 0);
            this.ctx.lineTo(xi * GRID_SIZE + xo, SCREEN_SIZE.y);
            this.ctx.closePath();
            this.ctx.stroke();
        }
        let yo = (cameraOffset.y % GRID_SIZE + GRID_SIZE) % GRID_SIZE;
        for (let yi = 0; yi < Math.ceil(SCREEN_SIZE.y / GRID_SIZE); yi++) {
            // this.ctx.strokeStyle = (x % 50 == 0) ? "#222" : "#111";
            this.ctx.beginPath();
            this.ctx.moveTo(0, yi * GRID_SIZE + yo);
            this.ctx.lineTo(SCREEN_SIZE.x, yi * GRID_SIZE + yo);
            this.ctx.closePath();
            this.ctx.stroke();
        }
    }
    searchComponents<Type extends IComponent>(cls: any): Type[] {
        return this.components.filter(function (x): x is Type {
            return x instanceof cls;
        });
    }
    getCameraOffset(): Vector {
        let cameras = this.searchComponents<Camera>(Camera);
        if (cameras.length > 0) {
            return SCREEN_SIZE.div(2).sub(cameras[0].position);
        }
        return Vector.ZERO;
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