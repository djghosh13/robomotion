const ELEMENT_COLOR_MAP = new Map([
    [FireworkElement.GUNPOWDER, "hsl(260, 20%, 30%)"],
    [FireworkElement.COPPER, "hsl(210, 95%, 45%)"],
    [FireworkElement.STRONTIUM, "hsl(345, 95%, 45%)"],
]);
class FireworkBox extends SimpleObject {
    constructor(position, capacity, { width = 40 }) {
        super(position, { width: width });
        this.capacity = capacity;
        this.prepared = false;
        this.contents = [];
    }
    addElement(element) {
        if (!this.prepared && this.contents.length < this.capacity) {
            this.contents.push(element);
        }
    }
    render(ctx) {
        ctx.fillStyle = "hsla(175, 25%, 15%, 50%)";
        ctx.beginPath();
        ctx.rect(this.position.x - this.width / 2, this.position.y - this.width / 2, this.width, this.width);
        ctx.closePath();
        ctx.fill();
        // Draw contents
        for (let i = 0; i < this.contents.length; i++) {
            ctx.fillStyle = ELEMENT_COLOR_MAP.get(this.contents[i]) || "rgb(255, 0, 255)";
            ctx.beginPath();
            ctx.rect(this.position.x - this.width / 2, this.position.y + this.width / 2 - (this.width / this.capacity) * i, this.width, -this.width / this.capacity);
            ctx.closePath();
            ctx.fill();
        }
        ctx.lineWidth = 3;
        ctx.strokeStyle = "hsl(175, 25%, 50%)";
        ctx.fillStyle = "hsla(175, 25%, 15%, 50%)";
        ctx.beginPath();
        ctx.rect(this.position.x - this.width / 2, this.position.y - this.width / 2, this.width, this.width);
        ctx.closePath();
        if (this.prepared) {
            ctx.fill();
        }
        ctx.stroke();
    }
}
class FireworkFiller extends SimpleAttractor {
    constructor(position, element, time, topLeft, bottomRight, { radius = 40, speed = 1 }) {
        super(position, { radius: radius, speed: speed });
        this.element = element;
        this.time = time;
        this.topLeft = topLeft;
        this.input = 0;
        this.firework = null;
        this.fillTime = 0;
        this.dimensions = bottomRight.sub(this.topLeft);
    }
    update(game) {
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
    render(ctx) {
        ctx.fillStyle = "hsla(0, 0%, 90%, 15%)";
        ctx.beginPath();
        ctx.rect(this.topLeft.x, this.topLeft.y, this.dimensions.x, this.dimensions.y);
        ctx.closePath();
        ctx.fill();
        if (this.firework != null) {
            ctx.fillStyle = "hsla(0, 0%, 90%, 40%)";
            ctx.beginPath();
            let top = 1.1 * this.fillTime / this.time - 0.1;
            let bottom = Math.min(top + 0.1, 1);
            ctx.rect(this.topLeft.x, this.topLeft.y + this.dimensions.y * Math.max(top, 0), this.dimensions.x, this.dimensions.y * (bottom - Math.max(top, 0)));
            ctx.closePath();
            ctx.fill();
        }
    }
}
class FireworkPreparer extends SimpleAttractor {
    constructor(position, { radius = 40, speed = 1 }) {
        super(position, { radius: radius, speed: speed });
        this.position = position;
        this.input = 0;
    }
    update(game) {
        super.update(game);
        if (this.input == 1 && this.heldObject instanceof FireworkBox) {
            this.heldObject.prepared = true;
        }
    }
    render(ctx) { }
}
class FireworkSpawner {
    constructor(position, maxFireworks, capacity, elements = []) {
        this.position = position;
        this.maxFireworks = maxFireworks;
        this.capacity = capacity;
        this.elements = elements;
        this.renderOrder = 100;
        this.input = 0;
        this.fireworks = [];
    }
    update(game) {
        // Remove non-existing firework boxes
        this.fireworks = this.fireworks.filter(firework => game.components.includes(firework));
        if (this.input == 1) {
            // Spawn new firework, delete oldest if needed
            if (this.fireworks.length == this.maxFireworks) {
                game.destroyObject(this.fireworks.shift());
            }
            let newFirework = new FireworkBox(this.position, this.capacity, {});
            for (let element of this.elements) {
                newFirework.addElement(element);
            }
            game.spawnObject(newFirework);
            this.fireworks.push(newFirework);
        }
    }
    render(ctx) { }
    get output() {
        return 1 - this.fireworks.length / this.maxFireworks;
    }
}
class FireworkLauncher extends SimpleAttractor {
    constructor(position, { radius = 40, speed = 1 }) {
        super(position, { radius: radius, speed: speed });
        this.position = position;
        this.input = 0;
    }
    update(game) {
        super.update(game);
        if (this.input == 1 && this.heldObject instanceof FireworkBox && this.heldObject.prepared) {
            // TODO Convoluted, fix
            if (game.heldBy(this.heldObject).length == 0 && this.heldObject.velocity.norm < 1) {
                // Fire!
                game.spawnObject(new FireworkTrail(this.position.add(new Vector(0, -100)), { power: 280, elements: this.heldObject.contents }));
                game.destroyObject(this.heldObject);
                this.heldObject = null;
            }
        }
    }
    render(ctx) { }
}