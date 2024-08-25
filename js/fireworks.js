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
    FireworkElement[FireworkElement["SPARKS"] = 8] = "SPARKS";
})(FireworkElement || (FireworkElement = {}));
;
const vsSource = `
precision mediump float;
attribute vec4 aVertexPosition;
attribute vec4 aVertexColor;
attribute float aVertexTime;
uniform vec2 uScreenSize; // Half screen size
uniform vec2 uScreenPadding;
varying vec2 vTextureCoords;
varying vec4 vColor;

vec3 hsl2rgb(vec3 hsl) {
    float C = (1.0 - abs(0.02 * hsl.z - 1.0)) * (0.01 * hsl.y);
    float X = C * (1.0 - abs(mod(hsl.x / 60.0, 2.0) - 1.0));
    float m = 0.01 * hsl.z - C / 2.0;
    if (hsl.x <  60.0) return vec3(C + m, X + m,     m);
    if (hsl.x < 120.0) return vec3(X + m, C + m,     m);
    if (hsl.x < 180.0) return vec3(    m, C + m, X + m);
    if (hsl.x < 240.0) return vec3(    m, X + m, C + m);
    if (hsl.x < 300.0) return vec3(X + m,     m, C + m);
                       return vec3(C + m,     m, X + m);
}

void main() {
    vec2 normPos = (aVertexPosition.xy + uScreenPadding) / (uScreenPadding + uScreenSize) - 1.0;
    gl_Position.x = normPos.x;
    gl_Position.y = -normPos.y;
    gl_Position.z = 1.0 - aVertexTime;
    gl_Position.w = 1.0;
    gl_PointSize = 1.5 * (2.0 + aVertexPosition.z);
    vTextureCoords = (gl_Position.xy + 1.0) / 2.0;
    vColor = vec4(
        hsl2rgb(vec3(
            aVertexColor.x,
            aVertexColor.y * min(1.2 * aVertexTime * aVertexTime, 1.0),
            clamp(aVertexColor.z + 20.0 * aVertexPosition.z, 0.0, 100.0) * aVertexTime
        )),
        min(1.5 * aVertexTime * aVertexTime, 1.0)
    );
}
`;
const fsSource = `
precision lowp float;
uniform sampler2D uTexture;
varying vec2 vTextureCoords;
varying vec4 vColor;

void main() {
    vec4 baseColor = texture2D(uTexture, vTextureCoords);
    gl_FragColor = vColor + baseColor * baseColor.a * (1.0 - vColor);
}
`;
const vsFadeSource = `
precision mediump float;
attribute vec4 aVertexPosition;
uniform vec2 uScreenSize; // Half screen size
uniform vec2 uScreenPadding;
uniform vec2 uTranslate;
varying vec2 vTextureCoords;

void main() {
    gl_Position = vec4(aVertexPosition.xy, 1.0, 1.0);
    vTextureCoords = (gl_Position.xy - uTranslate / (uScreenSize + uScreenPadding) + 1.0) / 2.0;
}
`;
const fsFadeSource = `
precision lowp float;
uniform sampler2D uTexture;
varying vec2 vTextureCoords;

void main() {
    vec4 oldColor = vec4(0);
    if (0.0 < vTextureCoords.x && vTextureCoords.x < 1.0 &&
            0.0 < vTextureCoords.y && vTextureCoords.y < 1.0) {
        oldColor = texture2D(uTexture, vTextureCoords);
    }
    gl_FragColor = vec4(oldColor.rgb, max(oldColor.a * 0.95 - 0.01, 0.0));
}
`;
function buildShaderProgram(gl, vertexSource, fragmentSource) {
    let vShader = gl.createShader(gl.VERTEX_SHADER);
    let fShader = gl.createShader(gl.FRAGMENT_SHADER);
    if (vShader != null && fShader != null) {
        gl.shaderSource(vShader, vertexSource);
        gl.shaderSource(fShader, fragmentSource);
        // Compile and log errors
        for (let shader of [vShader, fShader]) {
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error(gl.getShaderInfoLog(shader));
                gl.deleteShader(shader);
            }
        }
        // Shader program
        let shaderProgram = gl.createProgram();
        if (shaderProgram != null) {
            gl.attachShader(shaderProgram, vShader);
            gl.attachShader(shaderProgram, fShader);
            // Link and log errors
            gl.linkProgram(shaderProgram);
            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
                console.error(gl.getProgramInfoLog(shaderProgram));
            }
            return shaderProgram;
        }
    }
    return null;
}
class FireworkParticleManager {
    constructor() {
        this.renderOrder = 1000;
        this.CANVAS_PADDING = new Vector(10, 10);
        this.explosions = [];
        this.cameraPosition = this.previousCameraPosition = Vector.ZERO;
        let canvas = new OffscreenCanvas(SCREEN_SIZE.x + 2 * this.CANVAS_PADDING.x, SCREEN_SIZE.y + 2 * this.CANVAS_PADDING.y);
        // Init WebGL
        this.gl = canvas.getContext("webgl", { "premultipliedAlpha": false });
        this.shaderProgram = buildShaderProgram(this.gl, vsSource, fsSource);
        this.fadeShaderProgram = buildShaderProgram(this.gl, vsFadeSource, fsFadeSource);
        this.vertexBuffer = this.gl.createBuffer();
        this.colorBuffer = this.gl.createBuffer();
        this.timeBuffer = this.gl.createBuffer();
        this.lastTexture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.lastTexture);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, canvas.width, canvas.height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, new Uint8Array(4 * canvas.width * canvas.height).fill(255));
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
        // Get camera position
        this.cameraPosition = game.getCameraOffset();
    }
    render(ctx) {
        this.copyToTexture();
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.applyFadeShader();
        // Draw fireworks
        this.copyToTexture();
        let totalLength = this.explosions.reduce((len, explosion) => len + explosion.particles.length, 0);
        let positionData = new Float32Array(3 * totalLength);
        let colorData = new Float32Array(3 * totalLength);
        let timeData = new Float32Array(totalLength);
        let dataIndex = 0;
        for (let explosion of this.explosions) {
            for (let i = 0; i < explosion.particles.length; i++) {
                // Set vertex position
                let pos = explosion.particles[i]['position'].add(explosion.position).add(this.cameraPosition);
                positionData.set([
                    pos.x, pos.y, Math.tanh(explosion.particles[i]['z'])
                ], 3 * dataIndex);
                // Set vertex color
                let color = FireworkExplosion.ELEMENT_COLOR.get(explosion.particles[i]['element']);
                colorData.set([
                    color['h'], color['s'], color['l'],
                ], 3 * dataIndex);
                // Set time
                timeData.set([
                    explosion.lifetime / explosion.maxLifetime
                ], dataIndex);
                dataIndex++;
            }
        }
        // Vertex buffer
        this.bindVertexBuffer("aVertexPosition", this.vertexBuffer, positionData, 3);
        this.bindVertexBuffer("aVertexColor", this.colorBuffer, colorData, 3);
        this.bindVertexBuffer("aVertexTime", this.timeBuffer, timeData, 1);
        // Draw
        this.gl.useProgram(this.shaderProgram);
        this.gl.uniform2f(this.gl.getUniformLocation(this.shaderProgram, "uScreenSize"), SCREEN_SIZE.x / 2, SCREEN_SIZE.y / 2);
        this.gl.uniform2f(this.gl.getUniformLocation(this.shaderProgram, "uScreenPadding"), this.CANVAS_PADDING.x, this.CANVAS_PADDING.y);
        {
            this.gl.activeTexture(this.gl.TEXTURE0);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.lastTexture);
            let pointer = this.gl.getUniformLocation(this.shaderProgram, "uTexture");
            this.gl.uniform1i(pointer, 0);
        }
        this.gl.drawArrays(this.gl.POINTS, 0, totalLength);
        // Draw to main canvas
        ctx.drawImage(this.gl.canvas, this.CANVAS_PADDING.x, this.CANVAS_PADDING.y, SCREEN_SIZE.x, SCREEN_SIZE.y, 0, 0, SCREEN_SIZE.x, SCREEN_SIZE.y);
    }
    bindVertexBuffer(variable, buffer, data, size) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.DYNAMIC_DRAW);
        let pointer = this.gl.getAttribLocation(this.shaderProgram, variable);
        this.gl.vertexAttribPointer(pointer, size, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(pointer);
    }
    copyToTexture() {
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.lastTexture);
        this.gl.copyTexImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight, 0);
    }
    applyFadeShader() {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), this.gl.DYNAMIC_DRAW);
        let vertexPositionPointer = this.gl.getAttribLocation(this.fadeShaderProgram, "aVertexPosition");
        this.gl.vertexAttribPointer(vertexPositionPointer, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(vertexPositionPointer);
        this.gl.useProgram(this.fadeShaderProgram);
        // Adjust for camera position
        let offset = this.cameraPosition.sub(this.previousCameraPosition);
        this.previousCameraPosition = this.cameraPosition;
        this.gl.uniform2f(this.gl.getUniformLocation(this.fadeShaderProgram, "uScreenSize"), SCREEN_SIZE.x / 2, SCREEN_SIZE.y / 2);
        this.gl.uniform2f(this.gl.getUniformLocation(this.fadeShaderProgram, "uScreenPadding"), this.CANVAS_PADDING.x, this.CANVAS_PADDING.y);
        this.gl.uniform2f(this.gl.getUniformLocation(this.fadeShaderProgram, "uTranslate"), offset.x, offset.y);
        //
        {
            this.gl.activeTexture(this.gl.TEXTURE0);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.lastTexture);
            let pointer = this.gl.getUniformLocation(this.fadeShaderProgram, "uTexture");
            this.gl.uniform1i(pointer, 0);
        }
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
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
    [FireworkElement.ALUMINUM, { h: 240, s: 0, l: 80 }],
    [FireworkElement.SPARKS, { h: 15, s: 100, l: 75 }],
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
class Sparks extends FireworkExplosion {
    constructor(position) {
        super(position, 0, []);
        this.position = position;
        this.lifetime = this.maxLifetime = 2;
        // Spawn particles
        let angle = Math.random() * TWO_PI;
        let magnitude = 100 * (1 + (Math.random() - 0.5));
        this.particles.push({
            position: Vector.ZERO,
            z: -1,
            velocity: Vector.fromAngle(angle).mul(magnitude),
            zvelocity: 10 * Math.pow(Math.random() - 0.5, 3),
            element: FireworkElement.SPARKS
        });
        this.particles.push({
            position: Vector.ZERO,
            z: -1,
            velocity: Vector.fromAngle(angle + Math.PI / 4 * Math.random()).mul(magnitude),
            zvelocity: 10 * Math.pow(Math.random() - 0.5, 3),
            element: FireworkElement.SPARKS
        });
        this.particles.sort((a, b) => a['zvelocity'] - b['zvelocity']);
    }
    update(game) {
        if (this.lifetime <= 0.8 * this.maxLifetime) {
            this.lifetime = 0;
        }
        super.update(game);
    }
}
