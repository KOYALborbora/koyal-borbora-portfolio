// Shared noise toolkit for the two WebGL rooms.
//
// Value noise rather than simplex: it is a dozen lines, has no patent history,
// and its slightly blocky character is an asset here — the derivative-driven
// curl field ends up with the same short, ropey grain as a loaded brush.
// Imported as a string and prepended to the shaders that need it.

vec2 hash22(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}

float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  // Quintic fade — smoother second derivative than smoothstep, which matters
  // because the curl field differentiates this.
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p, int octaves) {
  float sum = 0.0;
  float amp = 0.5;
  // Irrational rotation between octaves kills the axis-aligned grid artefacts
  // that otherwise show up badly in a sky this smooth.
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 8; i++) {
    if (i >= octaves) break;
    sum += amp * vnoise(p);
    p = rot * p * 2.02;
    amp *= 0.5;
  }
  return sum;
}

// A full-screen fragment shader costs whatever it costs per pixel, and a phone
// has plenty of pixels and much less to spend on each one. Dropping two octaves
// roughly halves the work; at the scale these fields are viewed, the difference
// is a texture that is very slightly softer.
#ifdef LOW_QUALITY
  #define OCT_MID 2
  #define OCT_HIGH 3
#else
  #define OCT_MID 4
  #define OCT_HIGH 5
#endif

float fbm4(vec2 p) { return fbm(p, OCT_MID); }
float fbm5(vec2 p) { return fbm(p, OCT_HIGH); }

// Divergence-free flow. The perpendicular gradient of a scalar field cannot
// compress, so particles advected through it circulate instead of piling up —
// which is precisely the motion of the sky in The Starry Night.
vec2 curl(vec2 p, float t) {
  float e = 0.08;
  float n1 = fbm4(p + vec2(0.0, e) + t);
  float n2 = fbm4(p - vec2(0.0, e) + t);
  float n3 = fbm4(p + vec2(e, 0.0) + t);
  float n4 = fbm4(p - vec2(e, 0.0) + t);
  return vec2(n1 - n2, n4 - n3) / (2.0 * e);
}

// Domain warping: sample noise at a position that is itself displaced by noise.
// Two rounds is what turns bland cloud into something with currents in it.
float warpedFbm(vec2 p, float t, out vec2 warp) {
  vec2 q = vec2(fbm4(p + vec2(0.0, t * 0.06)), fbm4(p + vec2(5.2, 1.3)));
  vec2 r = vec2(
    fbm4(p + 4.0 * q + vec2(1.7 - t * 0.08, 9.2)),
    fbm4(p + 4.0 * q + vec2(8.3, 2.8 + t * 0.05))
  );
  warp = r;
  return fbm5(p + 4.0 * r);
}
