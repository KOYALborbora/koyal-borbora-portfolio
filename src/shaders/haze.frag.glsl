// The threshold ground.
//
// Almost nothing, on purpose. A near-black field with a slow warm current
// moving under it and a scatter of pigment motes catching the light — enough
// that the darkest room in the building is visibly alive before the visitor has
// touched anything, and quiet enough that bone-white type sits on it at full
// contrast.

precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform float uWeight;
uniform vec2 uPointer;
uniform vec3 uDrift;
uniform float uAspect;

uniform vec3 uBg;
uniform vec3 uAccent;
uniform vec3 uSecondary;

void main() {
  vec2 uv = vUv;
  vec2 p = (uv - 0.5) * vec2(uAspect, 1.0);
  p += uDrift.xy * 0.06;

  float t = uTime * 0.08;

  vec2 warp;
  float n = warpedFbm(p * 1.2, t, warp);

  vec3 col = uBg;
  // A slow teal current, strongest low in the frame.
  col = mix(col, uSecondary * 0.55, n * 0.16 * smoothstep(1.0, 0.1, uv.y));
  // And a warm one that follows the pointer, so the dark answers the hand.
  vec2 lamp = uPointer * vec2(0.42, 0.34);
  float toLamp = length((uv - 0.5 - lamp) * vec2(uAspect, 1.0));
  col += uAccent * 0.07 * smoothstep(0.85, 0.0, toLamp) * (0.55 + n * 0.6);

  // Pigment motes: a sparse grid, jittered, with a size that breathes.
  vec2 gp = uv * vec2(uAspect, 1.0) * 26.0;
  vec2 cell = floor(gp);
  vec2 jitter = hash22(cell);
  if (jitter.x > 0.82) {
    vec2 centre = cell + 0.15 + jitter * 0.7;
    float r = length(gp - centre);
    float pulse = 0.55 + 0.45 * sin(uTime * 0.7 + jitter.y * 6.28);
    float mote = smoothstep(0.16 * pulse, 0.0, r);
    col += mix(uAccent, uSecondary, jitter.y) * mote * 0.5;
  }

  // A vignette that keeps the eye in the middle, where the figure stands.
  col *= 1.0 - smoothstep(0.35, 1.05, length(p)) * 0.55;

  // Canvas tooth.
  col *= 0.96 + 0.075 * hash21(floor(uv * 800.0));

  gl_FragColor = vec4(col, uWeight);
}
