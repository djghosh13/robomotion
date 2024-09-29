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
        this.CANVAS_PADDING = SCREEN_SIZE.mul(0.25).floor();
        this.explosions = [];
        this.cameraPosition = this.previousCameraPosition = Vector.ZERO;
        let canvas = new OffscreenCanvas(SCREEN_SIZE.x + 2 * this.CANVAS_PADDING.x, SCREEN_SIZE.y + 2 * this.CANVAS_PADDING.y);
        // Init WebGL
        this.gl = canvas.getContext("webgl", { "premultipliedAlpha": false });
        this.particleShaderProgram = buildShaderProgram(this.gl, particleVSSource, particleFSSource);
        this.overlayShaderProgram = buildShaderProgram(this.gl, overlayVSSource, overlayFSSource);
        this.vertexBuffer = this.gl.createBuffer();
        this.colorBuffer = this.gl.createBuffer();
        this.timeBuffer = this.gl.createBuffer();
        {
            // Create particle texture
            this.particleTexture = this.gl.createTexture();
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.particleTexture);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
            // Create particle framebuffer
            this.particleFramebuffer = this.gl.createFramebuffer();
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.particleFramebuffer);
            this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.particleTexture, 0);
        }
        {
            // Create intermediate texture
            this.overlayTexture = this.gl.createTexture();
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.overlayTexture);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, new Uint8Array(4 * this.gl.drawingBufferWidth * this.gl.drawingBufferHeight).fill(0));
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        }
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
        // Get camera position
        this.cameraPosition = game.getCameraOffset();
    }
    render(ctx) {
        // Draw firework particles (pre-multiplied alpha)
        this.runParticleShader();
        // Combine trail and particles
        this.runOverlayShader();
        this.copyToTexture();
        // Draw to main canvas
        ctx.drawImage(this.gl.canvas, this.CANVAS_PADDING.x, this.CANVAS_PADDING.y, SCREEN_SIZE.x, SCREEN_SIZE.y, 0, 0, SCREEN_SIZE.x, SCREEN_SIZE.y);
    }
    runParticleShader() {
        // Concatenate particle data
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
        this.gl.useProgram(this.particleShaderProgram);
        // Set attributes and uniforms
        this.bindVertexBuffer(this.particleShaderProgram, "aVertexPosition", this.vertexBuffer, positionData, 3);
        this.bindVertexBuffer(this.particleShaderProgram, "aVertexColor", this.colorBuffer, colorData, 3);
        this.bindVertexBuffer(this.particleShaderProgram, "aVertexTime", this.timeBuffer, timeData, 1);
        this.gl.uniform2f(this.gl.getUniformLocation(this.particleShaderProgram, "uScreenSize"), SCREEN_SIZE.x / 2, SCREEN_SIZE.y / 2);
        this.gl.uniform2f(this.gl.getUniformLocation(this.particleShaderProgram, "uScreenPadding"), this.CANVAS_PADDING.x, this.CANVAS_PADDING.y);
        // Draw to framebuffer
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.particleFramebuffer);
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.blendFuncSeparate(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_COLOR, this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.drawArrays(this.gl.POINTS, 0, totalLength);
    }
    runOverlayShader() {
        this.gl.useProgram(this.overlayShaderProgram);
        // Set attributes and uniforms
        const screenBounds = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
        this.bindVertexBuffer(this.overlayShaderProgram, "aVertexPosition", this.vertexBuffer, screenBounds, 2);
        let offset = this.cameraPosition.sub(this.previousCameraPosition);
        this.previousCameraPosition = this.cameraPosition;
        this.gl.uniform2f(this.gl.getUniformLocation(this.overlayShaderProgram, "uScreenSize"), SCREEN_SIZE.x / 2, SCREEN_SIZE.y / 2);
        this.gl.uniform2f(this.gl.getUniformLocation(this.overlayShaderProgram, "uScreenPadding"), this.CANVAS_PADDING.x, this.CANVAS_PADDING.y);
        this.gl.uniform2f(this.gl.getUniformLocation(this.overlayShaderProgram, "uTranslate"), offset.x, offset.y);
        // Bind texture uniforms
        this.bindTexture(this.overlayShaderProgram, "uOverlayTexture", 0, this.overlayTexture);
        this.bindTexture(this.overlayShaderProgram, "uParticleTexture", 1, this.particleTexture);
        // Draw to main framebuffer
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.blendFunc(this.gl.ONE, this.gl.ZERO);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }
    bindVertexBuffer(program, variable, buffer, data, size) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.DYNAMIC_DRAW);
        let pointer = this.gl.getAttribLocation(program, variable);
        this.gl.vertexAttribPointer(pointer, size, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(pointer);
    }
    bindTexture(program, variable, index, texture) {
        this.gl.activeTexture(this.gl.TEXTURE0 + index);
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        let pointer = this.gl.getUniformLocation(program, variable);
        this.gl.uniform1i(pointer, index);
    }
    copyToTexture() {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.overlayTexture);
        this.gl.copyTexImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight, 0);
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
    constructor(position, power = 0) {
        super(position, 0, []);
        this.position = position;
        this.lifetime = this.maxLifetime = 2;
        // Spawn particles
        let angle = Math.random() * TWO_PI;
        let magnitude = ((power == 0) ? 60 : 120) * (1 + 0.5 * (Math.random() - 0.5));
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
