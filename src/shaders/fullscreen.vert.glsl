// A quad that always fills the viewport exactly.
//
// The two sky rooms are screen-space effects, not objects in a scene: writing
// clip space directly means a click at (x, y) on the page maps to (x, y) in the
// shader with no unprojection, which is what makes "Light the Stars" and "Calm
// the Sky" straightforward to aim. Camera movement still reaches the shader —
// as an explicit `uDrift` uniform — so the drift is authored rather than
// inherited.
//
// Expects a PlaneGeometry(1, 1): its positions span -0.5 to 0.5.

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position.xy * 2.0, 0.0, 1.0);
}
