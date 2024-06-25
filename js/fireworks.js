var FireworkElement;
(function (FireworkElement) {
    FireworkElement[FireworkElement["GUNPOWDER"] = 0] = "GUNPOWDER";
    FireworkElement[FireworkElement["COPPER"] = 1] = "COPPER";
    FireworkElement[FireworkElement["STRONTIUM"] = 2] = "STRONTIUM";
    FireworkElement[FireworkElement["CALCIUM"] = 3] = "CALCIUM";
    FireworkElement[FireworkElement["SODIUM"] = 4] = "SODIUM";
})(FireworkElement || (FireworkElement = {}));
;
class FireworkExplosion {
    constructor(position, power, elements) {
        this.position = position;
        this.renderOrder = 500;
        this.lifetime = this.maxLifetime = 5;
        this.particles = [];
        for (let element of elements) {
            // Get random angles
            let baseAngle = Math.PI / 4 * (Math.random() - 0.5) - Math.PI / 2;
            let angles = [];
            for (let i = -20; i <= 20; i++) {
                angles.push(i * Math.PI / 22 + baseAngle + Math.PI / 16 * (Math.random() - 0.5));
            }
            // Spawn particles
            for (let i = 0; i < angles.length; i++) {
                let magnitude = power * (1 + (Math.random() - 0.5));
                this.particles.push({
                    position: Vector.ZERO,
                    z: 0,
                    velocity: Vector.fromAngle(angles[i]).mul(magnitude),
                    zvelocity: 10 * Math.pow(Math.random() - 0.5, 3),
                    element: element
                });
            }
        }
        this.particles.sort((a, b) => a['zvelocity'] - b['zvelocity']);
        let canvas = new OffscreenCanvas(800, 800);
        this.drawbuffer = canvas.getContext("2d");
    }
    update(game) {
        const DRAG = 0.1;
        const GRAVITY = 150 * this.lifetime / this.maxLifetime;
        for (let particle of this.particles) {
            particle['position'] = particle['position'].add(particle['velocity'].mul(FRAME_INTERVAL / 1000));
            particle['z'] += particle['zvelocity'] * FRAME_INTERVAL / 1000;
            particle['velocity'] = particle['velocity']
                .mul(Math.pow(DRAG, FRAME_INTERVAL / 1000))
                .add(new Vector(0, GRAVITY).mul(FRAME_INTERVAL / 1000));
            particle['zvelocity'] *= Math.pow(DRAG, FRAME_INTERVAL / 1000);
        }
        this.lifetime -= FRAME_INTERVAL / 1000;
        if (this.lifetime <= 0) {
            game.destroyObject(this);
        }
    }
    render(ctx) {
        let t = this.lifetime / this.maxLifetime;
        // Fade out firework trail
        this.drawbuffer.globalCompositeOperation = "destination-in";
        this.drawbuffer.fillStyle = "hsla(0, 0%, 0%, 90%)";
        this.drawbuffer.beginPath();
        this.drawbuffer.fillRect(0, 0, 800, 800);
        this.drawbuffer.closePath();
        // Draw new particle positions
        this.drawbuffer.globalCompositeOperation = "source-over";
        for (let particle of this.particles) {
            let color = FireworkExplosion.ELEMENT_COLOR.get(particle['element']);
            let hue = color['h'];
            let sat = color['s'] * t;
            let light = Math.min(Math.max(color['l'] + 20 * Math.tanh(particle['z']), 0), 100);
            let alpha = 100 * Math.min(1.5 * t * t, 1);
            let psize = 2 + Math.tanh(particle['z']);
            this.drawbuffer.strokeStyle = `hsla(${hue}, ${sat}%, ${light}%, ${alpha}%)`;
            this.drawbuffer.beginPath();
            this.drawbuffer.rect(400 + particle['position'].x, 400 + particle['position'].y, psize, psize);
            this.drawbuffer.closePath();
            this.drawbuffer.stroke();
        }
        let savedAlpha = ctx.globalAlpha;
        ctx.globalAlpha = Math.min(t / 0.2, 1);
        ctx.drawImage(this.drawbuffer.canvas, this.position.x - 400, this.position.y - 400);
        ctx.globalAlpha = savedAlpha;
    }
}
FireworkExplosion.ELEMENT_COLOR = new Map([
    [FireworkElement.GUNPOWDER, { h: 0, s: 0, l: 70 }],
    [FireworkElement.COPPER, { h: 210, s: 100, l: 50 }],
    [FireworkElement.STRONTIUM, { h: 345, s: 100, l: 50 }],
    [FireworkElement.CALCIUM, { h: 40, s: 100, l: 50 }],
    [FireworkElement.SODIUM, { h: 65, s: 100, l: 50 }]
]);
class FireworkTrail extends FireworkExplosion {
    constructor(position, power, elements) {
        super(position, 0, []);
        this.position = position;
        this.power = power;
        this.elements = elements;
        this.fired = false;
        this.lifetime = this.maxLifetime = 3;
        this.particles = [{
                position: Vector.ZERO,
                z: 0,
                velocity: new Vector(0, -800),
                zvelocity: 0,
                element: FireworkElement.GUNPOWDER
            }];
    }
    update(game) {
        super.update(game);
        if (!this.fired && this.particles[0]['velocity'].y >= 0) {
            // Reached the top of the trajectory
            this.fired = true;
            game.spawnObject(new FireworkExplosion(this.position.add(this.particles[0]['position']), this.power, this.elements));
        }
    }
}
