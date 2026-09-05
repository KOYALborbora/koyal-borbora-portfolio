// Auvers, and the turn the whole site has been built to make.
//
// One shader holding two paintings. At uCalm = 0 it is a wheatfield under a
// churning gold sky with crows going over; at uCalm = 1 it is Almond Blossom —
// pale blue, still, a branch in flower. The visitor moves it from one to the
// other by hand, which is the point: the resolution is something they do, not
// something that happens to them.

precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform float uWeight;
uniform float uCalm;      // 0 = storm, 1 = blossom
uniform float uProgress;
uniform vec2 uPointer;
uniform vec3 uDrift;
uniform float uAspect;

uniform vec3 uWheat;      // wheat gold
uniform vec3 uCrow;       // crow black
uniform vec3 uBlossom;    // blossom blue
uniform vec3 uTeal;

float sdSegment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

// A crow: two shallow arcs meeting at the body. Van Gogh drew them with about
// this much detail, which is to say almost none, and it is plenty.
float crow(vec2 p, vec2 c, float scale, float flap) {
  vec2 q = (p - c) / scale;
  if (abs(q.x) > 1.2 || abs(q.y) > 0.9) return 0.0;
  float wing = -abs(q.x) * 0.55 + sin(flap) * 0.18 * abs(q.x);
  float d = abs(q.y - wing) - (0.075 - abs(q.x) * 0.05);
  return (1.0 - smoothstep(0.0, 0.045, d)) * step(abs(q.x), 1.0);
}

void main() {
  vec2 uv = vUv;
  vec2 p = (uv - 0.5) * vec2(uAspect, 1.0);
  p += uDrift.xy * 0.1 + uPointer * 0.02;

  float calm = clamp(uCalm, 0.0, 1.0);
  float storm = 1.0 - calm;

  // Turbulence dies down as the sky settles; it never quite reaches zero,
  // because a completely still sky reads as a screenshot.
  float t = uTime * mix(0.55, 0.12, calm);
  vec2 warp;
  float n = warpedFbm(p * mix(2.4, 1.1, calm), t, warp);
  float ridge = pow(clamp(1.0 - abs(n - 0.5) * 2.0, 0.0, 1.0), mix(2.2, 3.4, calm));

  vec3 skyLow = mix(uWheat * 0.75, uBlossom, calm);
  vec3 skyHigh = mix(uWheat * 1.05, mix(uBlossom, vec3(1.0), 0.45), calm);
  vec3 col = mix(skyLow, skyHigh, smoothstep(0.05, 1.0, uv.y));

  vec3 strokeTint = mix(uCrow, uTeal, calm);
  col = mix(col, strokeTint, ridge * mix(0.42, 0.12, calm));

#ifdef LOW_QUALITY
  col *= 0.82 + ridge * mix(0.36, 0.2, calm);
#else
  // Impasto, as in the Saint-Rémy sky, flattening as the paint dries.
  float e = 0.004;
  float h0 = fbm4(p * 3.0 + warp * 1.6);
  float hx = fbm4((p + vec2(e, 0.0)) * 3.0 + warp * 1.6) - h0;
  float hy = fbm4((p + vec2(0.0, e)) * 3.0 + warp * 1.6) - h0;
  vec3 normal = normalize(vec3(-hx * mix(70.0, 26.0, calm), -hy * mix(70.0, 26.0, calm), 1.0));
  float lambert = clamp(dot(normal, normalize(vec3(-0.5, 0.72, 0.5))), 0.0, 1.0);
  col *= 0.78 + lambert * 0.4;
#endif

  // ── The wheatfield, which recedes as the sky calms ──────────────────────
  float horizon = 0.3 + fbm4(vec2(uv.x * 2.4, 1.7)) * 0.05;
  float field = smoothstep(horizon + 0.02, horizon - 0.02, uv.y) * storm;
  if (field > 0.001) {
    // Near-vertical dashes, leaning with the wind — the way he laid a field in.
    float lean = sin(uv.x * 6.0 + uTime * 0.8) * 0.25;
    // Lower frequency than looks right in isolation: at 220 the rows alias
    // into a barcode on any display that is not enormous. The grain comes back
    // from the noise term instead, which cannot alias the same way.
    float rows = sin(uv.x * 90.0 + lean * 24.0 + vnoise(uv * 26.0) * 9.0);
    rows *= 0.65 + 0.35 * vnoise(uv * vec2(8.0, 40.0) + uTime * 0.05);
    vec3 wheat = mix(uWheat * 0.6, uWheat * 1.12, rows * 0.5 + 0.5);
    wheat = mix(wheat, uCrow, smoothstep(0.32, 0.0, uv.y) * 0.35);
    col = mix(col, wheat, field);
  }

  // ── Crows, which leave ──────────────────────────────────────────────────
  float birds = 0.0;
  for (int i = 0; i < 7; i++) {
    float fi = float(i);
    // Each crow drifts across on its own path and, as the sky calms, climbs
    // out of frame rather than fading out on the spot.
    float x = fract(0.12 + fi * 0.15 + uTime * (0.012 + fi * 0.004)) * 1.25 - 0.12;
    float y = 0.55 + sin(uTime * 0.5 + fi * 2.1) * 0.09 + fi * 0.035 + calm * 0.75;
    float scale = 0.028 + mod(fi, 3.0) * 0.009;
    birds = max(birds, crow(uv, vec2(x, y), scale, uTime * 5.0 + fi));
  }
  col = mix(col, uCrow, birds * storm * 0.92);

  // ── The almond branch, which arrives ────────────────────────────────────
  if (calm > 0.001) {
    // A bough entering from the top right and forking twice. Kept clear of the
    // left third, where the room's writing lives, and measured in aspect-
    // corrected space so a twig is as thin across as it is down.
    vec2 sc = vec2(uAspect, 1.0);
    vec2 a = vec2(1.08, 0.97) * sc;
    vec2 b = vec2(0.88, 0.86) * sc;
    vec2 c = vec2(0.72, 0.88) * sc;
    vec2 d1 = vec2(0.57, 0.79) * sc;
    vec2 e1 = vec2(0.81, 0.71) * sc;
    vec2 f1 = vec2(0.69, 0.62) * sc;
    // Sampled through a small noise offset, so the bough's edge is bark rather
    // than a perfectly straight capsule.
    vec2 up = uv * sc + (vec2(vnoise(uv * 34.0), vnoise(uv * 34.0 + 7.3)) - 0.5) * 0.012;

    // Radii taper from trunk to twig, which is most of what makes a few line
    // segments read as something that grew rather than something that was cut.
    float branch = 1e9;
    branch = min(branch, sdSegment(up, a, b) - 0.0135);
    branch = min(branch, sdSegment(up, b, c) - 0.0105);
    branch = min(branch, sdSegment(up, c, d1) - 0.0072);
    branch = min(branch, sdSegment(up, b, e1) - 0.0068);
    branch = min(branch, sdSegment(up, e1, f1) - 0.0042);
    float bough = 1.0 - smoothstep(0.0, 0.003, branch);
    col = mix(col, mix(uCrow, uTeal, 0.28), bough * calm);

    // Blossom, clustered along the bough. Each is a soft white disc with a
    // warmer centre, opening on a slight stagger so the branch flowers rather
    // than switching on.
    for (int i = 0; i < 14; i++) {
      float fi = float(i);
      float s = fract(fi * 0.6180339887);
      vec2 base = mix(a, d1, s);
      base = mix(base, mix(b, f1, s), 0.5 * fract(fi * 0.31));
      base += vec2(cos(fi * 2.4), sin(fi * 1.7)) * 0.035;

      float open = clamp((calm - 0.15 - s * 0.35) * 3.2, 0.0, 1.0);
      if (open <= 0.0) continue;

      // `base` is already in aspect-corrected space, so the petal is round.
      float r = length(up - base);
      float petal = 0.023 * open * (0.72 + 0.5 * sin(fi * 3.1));
      float flower = smoothstep(petal, petal * 0.2, r);
      col = mix(col, vec3(0.98, 0.96, 0.94), flower * 0.92);
      // A warmer heart to each flower, which is what stops a white disc reading
      // as a highlight and starts it reading as a blossom.
      col = mix(col, vec3(0.95, 0.84, 0.76), smoothstep(petal * 0.34, 0.0, r) * 0.85);
    }
  }

  // Canvas tooth.
  col *= 0.97 + 0.055 * hash21(floor(uv * 850.0));

  gl_FragColor = vec4(col, uWeight);
}
