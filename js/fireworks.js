var FireworkElement;
(function (FireworkElement) {
    FireworkElement[FireworkElement["GUNPOWDER"] = 0] = "GUNPOWDER";
    FireworkElement[FireworkElement["COPPER"] = 1] = "COPPER";
    FireworkElement[FireworkElement["STRONTIUM"] = 2] = "STRONTIUM";
    FireworkElement[FireworkElement["CALCIUM"] = 3] = "CALCIUM";
    FireworkElement[FireworkElement["SODIUM"] = 4] = "SODIUM";
    FireworkElement[FireworkElement["BARIUM"] = 5] = "BARIUM";
    FireworkElement[FireworkElement["TITANIUM"] = 6] = "TITANIUM";
    FireworkElement[FireworkElement["ALUMINUM"] = 7] = "ALUMINUM";
})(FireworkElement || (FireworkElement = {}));
;
const vsSource = `
attribute vec4 aVertexPosition;
attribute vec4 aVertexColor;
uniform lowp float uTime;
uniform lowp vec2 uScreenSize;
varying lowp vec4 vColor;

void main() {
    gl_Position.x = 2.0 * aVertexPosition.x / uScreenSize.x - 1.0;
    gl_Position.y = 1.0 - 2.0 * aVertexPosition.y / uScreenSize.y;
    gl_Position.z = 0.0;
    gl_Position.w = 1.0;
    vColor = vec4(
        aVertexColor.x,
        aVertexColor.y * min(1.5 * uTime * uTime, 1.0),
        aVertexColor.z * uTime,
        min(1.5 * uTime * uTime, 1.0) * min(uTime / 0.2, 1.0)
    );
}
`;
const fsSource = `
uniform lowp float uTime;
varying lowp vec4 vColor;

lowp vec3 hsl2rgb(lowp vec3 hsl) {
    lowp float C = (1.0 - abs(0.02 * hsl.z - 1.0)) * (0.01 * hsl.y);
    lowp float X = C * (1.0 - abs(mod(hsl.x / 60.0, 2.0) - 1.0));
    lowp float m = 0.01 * hsl.z - C / 2.0;
    if (hsl.x <  60.0) return vec3(C + m, X + m,     m);
    if (hsl.x < 120.0) return vec3(X + m, C + m,     m);
    if (hsl.x < 180.0) return vec3(    m, C + m, X + m);
    if (hsl.x < 240.0) return vec3(    m, X + m, C + m);
    if (hsl.x < 300.0) return vec3(X + m,     m, C + m);
                       return vec3(C + m,     m, X + m);
}

void main() {
    gl_FragColor = vec4(hsl2rgb(vColor.xyz), vColor.a);
}
`;
class FireworkParticleManager {
    constructor(width = 640, height = 480) {
        this.width = width;
        this.height = height;
        this.renderOrder = 1000;
        this.explosions = [];
        let canvas = new OffscreenCanvas(this.width, this.height);
        // Init WebGL
        this.gl = canvas.getContext("webgl", { "premultipliedAlpha": false });
        let vShader = this.gl.createShader(this.gl.VERTEX_SHADER);
        let fShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
        if (vShader != null && fShader != null) {
            this.gl.shaderSource(vShader, vsSource);
            this.gl.shaderSource(fShader, fsSource);
            // Compile and log errors
            for (let shader of [vShader, fShader]) {
                this.gl.compileShader(shader);
                if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
                    console.error(this.gl.getShaderInfoLog(shader));
                    this.gl.deleteShader(shader);
                }
            }
            // Shader program
            let shaderProgram = this.gl.createProgram();
            if (shaderProgram != null) {
                this.gl.attachShader(shaderProgram, vShader);
                this.gl.attachShader(shaderProgram, fShader);
                // Link and log errors
                this.gl.linkProgram(shaderProgram);
                if (!this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS)) {
                    console.error(this.gl.getProgramInfoLog(shaderProgram));
                }
                this.shaderProgram = shaderProgram;
            }
        }
        this.vertexBuffer = this.gl.createBuffer();
        this.colorBuffer = this.gl.createBuffer();
        this.gl.enable(this.gl.BLEND);
    }
    update(game) {
        // Remove dead fireworks
        while (this.explosions.length && this.explosions[0].lifetime <= 0) {
            this.explosions.shift();
        }
        // Add detected fireworks
        for (let firework of game.searchComponents(FireworkExplosion)) {
            if (!firework.registered) {
                firework.registered = true;
                let insertAt = 0;
                for (; insertAt < this.explosions.length; insertAt++) {
                    if (this.explosions[insertAt].lifetime > firework.lifetime) {
                        break;
                    }
                }
                this.explosions.splice(insertAt, 0, firework);
            }
        }
    }
    render(ctx) {
        this.gl;
        this.gl.clearColor(0, 0, 0, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.blendFuncSeparate(this.gl.ONE, this.gl.ONE_MINUS_SRC_COLOR, this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
        for (let explosion of this.explosions) {
            let positionData = new Float32Array(2 * 3 * explosion.particles.length);
            let colorData = new Float32Array(3 * 3 * explosion.particles.length);
            for (let i = 0; i < explosion.particles.length; i++) {
                // Set vertex position
                let pos = explosion.particles[i]['position'].add(explosion.position);
                let diff = 1;
                const SQRT_3 = Math.sqrt(3);
                positionData.set([
                    pos.x - diff * SQRT_3, pos.y + diff,
                    pos.x, pos.y - diff * 2,
                    pos.x + diff * SQRT_3, pos.y + diff,
                ], 2 * 3 * i);
                // Set vertex color
                let color = FireworkExplosion.ELEMENT_COLOR.get(explosion.particles[i]['element']);
                colorData.set([
                    color['h'], color['s'], color['l'],
                    color['h'], color['s'], color['l'],
                    color['h'], color['s'], color['l'],
                ], 3 * 3 * i);
            }
            // Vertex buffer
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, positionData, this.gl.DYNAMIC_DRAW);
            let vertexPositionPointer = this.gl.getAttribLocation(this.shaderProgram, "aVertexPosition");
            this.gl.vertexAttribPointer(vertexPositionPointer, 2, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(vertexPositionPointer);
            // Color buffer
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, colorData, this.gl.DYNAMIC_DRAW);
            let vertexColorPointer = this.gl.getAttribLocation(this.shaderProgram, "aVertexColor");
            this.gl.vertexAttribPointer(vertexColorPointer, 3, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(vertexColorPointer);
            // Draw
            this.gl.useProgram(this.shaderProgram);
            this.gl.uniform1f(this.gl.getUniformLocation(this.shaderProgram, "uTime"), explosion.lifetime / explosion.maxLifetime);
            this.gl.uniform2f(this.gl.getUniformLocation(this.shaderProgram, "uScreenSize"), this.width, this.height);
            this.gl.drawArrays(this.gl.TRIANGLES, 0, 3 * explosion.particles.length);
        }
        // let savedAlpha = ctx.globalAlpha;
        // ctx.globalAlpha = Math.min(t / 0.2, 1);
        ctx.drawImage(this.gl.canvas, 0, 0);
        // ctx.globalAlpha = savedAlpha;
    }
}
class FireworkExplosion {
    constructor(position, power, elements) {
        this.position = position;
        this.renderOrder = 500;
        this.registered = false;
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
    render(ctx) { }
}
FireworkExplosion.ELEMENT_COLOR = new Map([
    [FireworkElement.GUNPOWDER, { h: 0, s: 0, l: 70 }],
    [FireworkElement.COPPER, { h: 220, s: 100, l: 40 }],
    [FireworkElement.STRONTIUM, { h: 355, s: 100, l: 50 }],
    [FireworkElement.CALCIUM, { h: 15, s: 100, l: 50 }],
    [FireworkElement.SODIUM, { h: 40, s: 90, l: 55 }],
    [FireworkElement.BARIUM, { h: 125, s: 100, l: 45 }],
    [FireworkElement.TITANIUM, { h: 240, s: 10, l: 55 }],
    [FireworkElement.ALUMINUM, { h: 240, s: 0, l: 80 }]
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
