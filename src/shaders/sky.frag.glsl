// Saint-Rémy. The sky the whole site has been walking towards.
//
// Domain-warped fbm supplies the currents; folding it into ridges turns the
// smooth field into discrete ropes of paint; and lighting those ridges as a
// height map gives the strokes real thickness, so they catch the light as the
// camera drifts rather than reading as a flat printed picture.

precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform float uProgress;   // 0 -> 1 through the room
uniform float uWeight;     // 0 -> 1 presence, for dissolving between rooms
uniform vec2 uPointer;     // -1 -> 1
uniform vec3 uDrift;       // camera position, eased by the rig in StageCanvas
uniform float uAspect;

uniform vec3 uNight;
uniform vec3 uSwirl;
uniform vec3 uStar;

#define MAX_STARS 32
uniform vec3 uStars[MAX_STARS]; // xy = position in screen uv, z = age in seconds
uniform int uStarCount;

// A cypress: the dark flame Van Gogh put in the foreground of half the
// Saint-Rémy canvases. A tapered, wavering spine, roughened into foliage.
float cypress(vec2 q, float cx, float scale, float t) {
  q.x = (q.x - cx) / scale;
  q.y /= scale;
  if (q.y < -0.05 || q.y > 1.1) return 0.0;

  // Sway grows with height, the way a real tree bends.
  q.x -= sin(t * 0.35 + q.y * 2.4 + cx * 9.0) * 0.045 * q.y * q.y;

  float width = 0.16 * (1.0 - smoothstep(0.0, 1.05, q.y));
  width *= 0.72 + 0.55 * vnoise(vec2(q.y * 9.0 + cx * 30.0, t * 0.12));
  // Width is measured across the viewport and height down it, so on a portrait
  // phone an uncorrected tree comes out as a spike. Normalised against a
  // landscape reference, and capped so it never becomes a hedge.
  width *= min(2.2, 1.6 / max(0.35, uAspect));
  return (1.0 - smoothstep(-0.012, 0.012, abs(q.x) - width)) * step(q.y, 1.05);
}

void main() {
  vec2 uv = vUv;
  vec2 p = (uv - 0.5) * vec2(uAspect, 1.0);

  // Camera drift, applied to the noise domain rather than to geometry: the
  // visitor moves through the sky instead of past it.
  p *= 1.0 + (6.0 - uDrift.z) * 0.05;
  p += uDrift.xy * 0.18 + uPointer * 0.03;

  float t = uTime * 0.5 + uProgress * 2.5;

  vec2 warp;
  float n = warpedFbm(p * 1.9, t, warp);

  // Ridges. This one fold is the difference between "swirling clouds" and
  // "strokes of thick paint".
  float ridge = pow(clamp(1.0 - abs(n - 0.5) * 2.0, 0.0, 1.0), 2.6);
  float bands = sin((n * 8.0 + length(warp) * 5.0 - t * 0.55) * 3.14159) * 0.5 + 0.5;

  vec3 col = mix(uNight * 0.42, uNight, smoothstep(0.0, 1.0, uv.y));
  col = mix(col, uSwirl, ridge * 0.62 * bands);
  col = mix(col, uStar * 0.75, pow(ridge, 3.0) * 0.32);

#ifdef LOW_QUALITY
  // Two more full fbm evaluations per fragment is the single most expensive
  // thing in this shader. On a phone the ridge field stands in for the height
  // gradient: less dimensional, and it keeps the frame budget.
  col *= 0.78 + ridge * 0.44;
  col += vec3(0.9, 0.85, 0.6) * pow(ridge, 5.0) * 0.18;
#else
  // Impasto lighting. The height field is sampled with the cheap fbm rather
  // than the warped one — three extra octaves per fragment instead of twenty,
  // and at this scale the difference is invisible.
  float e = 0.004;
  float h0 = fbm4(p * 3.4 + warp * 2.0);
  float hx = fbm4((p + vec2(e, 0.0)) * 3.4 + warp * 2.0) - h0;
  float hy = fbm4((p + vec2(0.0, e)) * 3.4 + warp * 2.0) - h0;
  vec3 normal = normalize(vec3(-hx * 60.0, -hy * 60.0, 1.0));
  float lambert = clamp(dot(normal, normalize(vec3(-0.55, 0.7, 0.45))), 0.0, 1.0);
  col += vec3(0.9, 0.85, 0.6) * pow(lambert, 14.0) * 0.24;
  col *= 0.74 + lambert * 0.46;
#endif

  // The moon, low and haloed, as he always painted it.
  vec2 moonP = (uv - vec2(0.82, 0.74)) * vec2(uAspect, 1.0);
  float moonD = length(moonP);
  col += uStar * smoothstep(0.075, 0.0, moonD) * 0.9;
  col += uStar * 0.16 * smoothstep(0.26, 0.05, moonD) * (0.7 + 0.3 * bands);

  // Stars the visitor has lit: a hard core, a soft halo, and four needles of
  // light — the shape a bright point makes through tired eyes.
  for (int i = 0; i < MAX_STARS; i++) {
    if (i >= uStarCount) break;
    vec3 s = uStars[i];
    vec2 d = (uv - s.xy) * vec2(uAspect, 1.0);
    float r = length(d);
    float ignite = 1.0 - exp(-s.z * 3.5);
    float flare = exp(-s.z * 2.2);
    float twinkle = 0.86 + 0.14 * sin(uTime * 2.1 + s.x * 40.0 + s.y * 25.0);

    float core = smoothstep(0.016 + flare * 0.02, 0.0, r);
    float halo = smoothstep(0.14 + flare * 0.1, 0.0, r);
    float needle =
      smoothstep(0.0016, 0.0, abs(d.x)) * smoothstep(0.1, 0.0, abs(d.y)) +
      smoothstep(0.0016, 0.0, abs(d.y)) * smoothstep(0.1, 0.0, abs(d.x));

    col += uStar * (core * 1.5 + halo * 0.5 + needle * 0.28) * ignite * twinkle;
    col += uSwirl * halo * 0.18 * ignite;
  }

  // Hills, so the sky has something to be above.
  float horizon = 0.14 + fbm4(vec2(uv.x * 3.0, 0.0)) * 0.07;
  col = mix(col, vec3(0.05, 0.09, 0.13), smoothstep(horizon + 0.012, horizon - 0.012, uv.y) * 0.9);

  // Cypresses, black against all of it.
  float trees = cypress(uv, 0.13, 0.95, uTime);
  trees = max(trees, cypress(uv - vec2(0.0, 0.02), 0.2, 0.62, uTime + 4.0));
  trees = max(trees, cypress(uv - vec2(0.0, 0.03), 0.9, 0.5, uTime + 9.0));
  col = mix(col, vec3(0.03, 0.05, 0.07), trees * 0.94);

  // Canvas tooth, so nothing here ever reads as a flat digital gradient.
  col *= 0.97 + 0.06 * hash21(floor(uv * 900.0));

  gl_FragColor = vec4(col, uWeight);
}
