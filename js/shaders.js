const particleVSSource = /* glsl */ `
precision mediump float;
attribute vec4 aVertexPosition;
attribute vec4 aVertexColor;
attribute float aVertexTime;
uniform vec2 uScreenSize; // Half screen size
uniform vec2 uScreenPadding;
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
    vColor = vec4(
        hsl2rgb(vec3(
            aVertexColor.x,
            aVertexColor.y * min(1.5 * aVertexTime * aVertexTime, 1.0),
            clamp(aVertexColor.z + 20.0 * aVertexPosition.z, 0.0, 100.0) * aVertexTime
        )),
        min(1.5 * aVertexTime * aVertexTime, 1.0)
    );
}
`;
const particleFSSource = /* glsl */ `
precision lowp float;
varying vec4 vColor;

void main() {
    gl_FragColor = vColor;
}
`;
const overlayVSSource = /* glsl */ `
precision mediump float;
attribute vec4 aVertexPosition;
uniform vec2 uScreenSize; // Half screen size
uniform vec2 uScreenPadding;
uniform vec2 uTranslate;
varying vec2 vOverlayCoords;
varying vec2 vParticleCoords;

void main() {
    gl_Position = vec4(aVertexPosition.xy, 1.0, 1.0);
    vOverlayCoords = (gl_Position.xy - uTranslate / (uScreenSize + uScreenPadding) + 1.0) / 2.0;
    vParticleCoords = (gl_Position.xy + 1.0) / 2.0;
}
`;
const overlayFSSource = /* glsl */ `
precision lowp float;
uniform sampler2D uOverlayTexture;
uniform sampler2D uParticleTexture;
varying vec2 vOverlayCoords;
varying vec2 vParticleCoords;

void main() {
    vec4 particleColor = texture2D(uParticleTexture, vParticleCoords);
    vec4 overlayColor = vec4(0);
    if (0.0 < vOverlayCoords.x && vOverlayCoords.x < 1.0 &&
            0.0 < vOverlayCoords.y && vOverlayCoords.y < 1.0) {
        overlayColor = texture2D(uOverlayTexture, vOverlayCoords);
    }
    float overlayAlpha = max(overlayColor.a * 0.95 - 0.01, 0.0);
    float alpha = particleColor.a + overlayAlpha * (1.0 - particleColor.a);
    vec3 postColor = particleColor.rgb + overlayColor.rgb * overlayAlpha * (1.0 - particleColor.rgb);
    gl_FragColor = vec4(postColor / max(alpha, 0.2), alpha);
}
`;
