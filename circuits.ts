class SimpleCircuit implements IComponent {
    constructor(public activator: IOutputter, public responder: IInputter) { }
    update(game: Game): void {
        this.responder.input = this.activator.output;
    }
    render(ctx: CanvasRenderingContext2D) { }
}

class Light implements IComponent, IInputter {
    constructor(public position: Vector, public hue: number = 134, public on: boolean = false) { }
    update(game: Game) { }
    render(ctx: CanvasRenderingContext2D) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = `hsl(${this.hue}, 70%, 20%)`;
        if (this.on) {
            ctx.strokeStyle = `hsl(${this.hue}, 90%, 60%)`;
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, 4, 0, TWO_PI);
            ctx.stroke();
            ctx.closePath();
        }
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, 10, 0, TWO_PI);
        ctx.stroke();
        ctx.closePath();
    }
    set input(value: number) {
        this.on = (value == 1);
    }
}

class WireLight implements IComponent, IInputter {
    constructor(public points: Vector[], public hue: number = 134, public input: number = 0) { }
    update(game: Game) { }
    render(ctx: CanvasRenderingContext2D) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = `hsl(${this.hue}, 70%, 20%)`;
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 0; i < this.points.length - 1; i++) {
            ctx.lineTo(this.points[i + 1].x, this.points[i + 1].y);
        }
        ctx.stroke();
        ctx.closePath();
        //
        let dists: number[] = [];
        for (let i = 0; i < this.points.length - 1; i++) {
            dists.push(this.points[i + 1].sub(this.points[i]).norm);
        }
        let totalDist = dists.reduce((a, x) => a + x) * this.input;
        // Draw
        ctx.strokeStyle = `hsl(${this.hue}, 85%, 35%)`;
        if (this.input == 1) {
            ctx.strokeStyle = `hsl(${this.hue}, 90%, 60%)`;
        }
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 0; i < dists.length; i++) {
            if (totalDist < dists[i]) {
                let middle = this.points[i].add(this.points[i + 1].sub(this.points[i]).mul(totalDist / dists[i]));
                ctx.lineTo(middle.x, middle.y);
                break;
            }
            totalDist -= dists[i];
            ctx.lineTo(this.points[i + 1].x, this.points[i + 1].y);
        }
        ctx.stroke();
        ctx.closePath();
    }
}
