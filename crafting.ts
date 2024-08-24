const ELEMENT_COLOR_MAP = new Map([
    [FireworkElement.GUNPOWDER, "hsl(260, 20%, 30%)"],
    [FireworkElement.COPPER, "hsl(210, 95%, 45%)"],
    [FireworkElement.STRONTIUM, "hsl(345, 95%, 45%)"],
]);


class FireworkBox extends SimpleObject {
    prepared: boolean;
    contents: FireworkElement[];
    constructor(position: Vector, public capacity: number, { width = 40 }) {
        super(position, { width: width });
        this.prepared = false;
        this.contents = [];
    }
    addElement(element: FireworkElement) {
        if (!this.prepared && this.contents.length < this.capacity) {
            this.contents.push(element);
        }
    }
    render(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = "hsla(175, 25%, 15%, 50%)";
        ctx.beginPath();
        ctx.rect(
            this.position.x - this.width/2,
            this.position.y - this.width/2,
            this.width, this.width
        );
        ctx.closePath();
        ctx.fill();
        // Draw contents
        for (let i = 0; i < this.contents.length; i++) {
            ctx.fillStyle = ELEMENT_COLOR_MAP.get(this.contents[i]) || "rgb(255, 0, 255)";
            ctx.beginPath();
            ctx.rect(
                this.position.x - this.width/2,
                this.position.y + this.width/2 - (this.width / this.capacity) * i,
                this.width, -this.width / this.capacity
            );
            ctx.closePath();
            ctx.fill();
        }
        ctx.lineWidth = 3;
        ctx.strokeStyle = "hsl(175, 25%, 50%)";
        ctx.fillStyle = "hsla(175, 25%, 15%, 50%)";
        ctx.beginPath();
        ctx.rect(
            this.position.x - this.width/2,
            this.position.y - this.width/2,
            this.width, this.width
        );
        ctx.closePath();
        if (this.prepared) {
            ctx.fill();
        }
        ctx.stroke();
    }
}


class FireworkFiller extends SimpleAttractor implements IInputter {
    input: number;
    dimensions: Vector;
    firework: FireworkBox | null;
    fillTime: number;
    constructor(position: Vector, public element: FireworkElement, public time: number,
            public topLeft: Vector, bottomRight: Vector,
            { radius = 40, speed = 1 }) {
        super(position, { radius: radius, speed: speed });
        this.input = 0;
        this.firework = null;
        this.fillTime = 0;
        this.dimensions = bottomRight.sub(this.topLeft);
    }
    update(game: Game) {
        super.update(game);
        // Reset progress if firework box is removed
        if (this.firework != this.heldObject) {
            this.firework = null;
            this.fillTime = 0;
        }
        // Start counter if firework box is present and filler is activated
        if (this.input == 1 && this.firework == null) {
            if (this.heldObject instanceof FireworkBox) {
                this.firework = this.heldObject;
            }
        }
        // Fill firework if time is reached
        if (this.firework != null) {
            this.fillTime += FRAME_INTERVAL / 1000;
            if (this.fillTime >= this.time) {
                this.firework.addElement(this.element);
                this.firework = null;
                this.fillTime = 0;
            }
        }
    }
    render(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = "hsla(0, 0%, 90%, 15%)";
        ctx.beginPath();
        ctx.rect(this.topLeft.x, this.topLeft.y, this.dimensions.x, this.dimensions.y);
        ctx.closePath();
        ctx.fill();
        if (this.firework != null) {
            ctx.fillStyle = "hsla(0, 0%, 90%, 40%)";
            ctx.beginPath();
            let top = 1.1 * this.fillTime/this.time - 0.1;
            let bottom = Math.min(top + 0.1, 1);
            ctx.rect(
                this.topLeft.x,
                this.topLeft.y + this.dimensions.y * Math.max(top, 0),
                this.dimensions.x,
                this.dimensions.y * (bottom - Math.max(top, 0))
            );
            ctx.closePath();
            ctx.fill();
        }
    }
}


class FireworkPreparer extends SimpleAttractor implements IInputter {
    input: number;
    constructor(public position: Vector, { radius = 40, speed = 1 }) {
        super(position, { radius: radius, speed: speed });
        this.input = 0;
    }
    update(game: Game) {
        super.update(game);
        if (this.input == 1 && this.heldObject instanceof FireworkBox) {
            this.heldObject.prepared = true;
        }
    }
    render(ctx: CanvasRenderingContext2D) { }
}


class FireworkSpawner implements IComponent, IInputter, IOutputter {
    renderOrder: number = 100;
    input: number;
    fireworks: FireworkBox[];
    constructor(public position: Vector, public maxFireworks: number, public capacity: number, public elements: FireworkElement[] = []) {
        this.input = 0;
        this.fireworks = [];
    }
    update(game: Game) {
        // Remove non-existing firework boxes
        this.fireworks = this.fireworks.filter(firework => game.components.includes(firework));
        if (this.input == 1) {
            // Spawn new firework, delete oldest if needed
            if (this.fireworks.length == this.maxFireworks) {
                game.destroyObject(this.fireworks.shift()!);
            }
            let newFirework = new FireworkBox(this.position, this.capacity, { });
            for (let element of this.elements) {
                newFirework.addElement(element);
            }
            game.spawnObject(newFirework);
            this.fireworks.push(newFirework);
        }
    }
    render(ctx: CanvasRenderingContext2D) { }
    get output() {
        return 1 - this.fireworks.length / this.maxFireworks;
    }
}


class FireworkLauncher extends SimpleAttractor implements IInputter {
    input: number;
    constructor(public position: Vector, { radius = 40, speed = 1 }) {
        super(position, { radius: radius, speed: speed });
        this.input = 0;
    }
    update(game: Game) {
        super.update(game);
        if (this.input == 1 && this.heldObject instanceof FireworkBox && this.heldObject.prepared) {
            // TODO Convoluted, fix
            if (game.heldBy(this.heldObject).length == 0 && this.heldObject.velocity.norm < 1) {
                // Fire!
                game.spawnObject(new FireworkTrail(
                    this.position.add(new Vector(0, -100)),
                    280, this.heldObject.contents
                ));
                game.destroyObject(this.heldObject)
                this.heldObject = null;
            }
        }
    }
    render(ctx: CanvasRenderingContext2D) { }
}
