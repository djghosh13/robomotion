enum FireworkElement {
    GUNPOWDER,
    COPPER, STRONTIUM,
};
function elementColorMap(element: FireworkElement): string {
    switch (element) {
        case FireworkElement.GUNPOWDER:
            return "hsl(260, 20%, 30%)";
        case FireworkElement.COPPER:
            return "hsl(210, 95%, 45%)";
        case FireworkElement.STRONTIUM:
            return "hsl(345, 95%, 45%)";
        default:
            throw new Error(`Missing color specification for element ${element}`);
    }
}


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
            ctx.fillStyle = elementColorMap(this.contents[i]);
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

class FireworkSpawner implements IComponent, IInputter {
    input: number;
    firework: FireworkBox | null;
    constructor(public position: Vector, public capacity: number, public elements: FireworkElement[]) {
        this.input = 0;
        this.firework = null;
    }
    update(game: Game) {
        if (this.input == 1) {
            if (this.firework != null) {
                game.destroyObject(this.firework);
            }
            this.firework = new FireworkBox(this.position, this.capacity, { });
            for (let element of this.elements) {
                this.firework.addElement(element);
            }
            game.spawnObject(this.firework);
        }
    }
    render(ctx: CanvasRenderingContext2D) { }
}