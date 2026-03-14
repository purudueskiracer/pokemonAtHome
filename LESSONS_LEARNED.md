# Lessons Learned

Running log of bugs, gotchas, and non-obvious decisions discovered during development.

---

## GLSL / WebGL

### `smoothstep` requires `edge0 < edge1`
**Date**: 2026-03-01  
**Symptom**: Shader rendered a completely black canvas (encounter background invisible).  
**Root cause**: `smoothstep(edge0, edge1, x)` is **undefined behavior in GLSL when `edge0 > edge1`**. Safari/WebGL silently outputs black rather than erroring. Desktop Chrome was also affected but failed silently.

**Broken**:
```glsl
float groundFill = smoothstep(1.08, 0.72, oval); // edge0 > edge1 — UB
```
**Fixed**: invert manually:
```glsl
float groundFill = 1.0 - smoothstep(0.72, 1.08, oval); // correct
```

### Safari requires explicit `precision` declarations
**Date**: 2026-03-01  
**Symptom**: Shader compiled fine in Chrome/Firefox, blank canvas in Safari.  
**Root cause**: Safari's WebGL implementation strictly requires a `precision` qualifier at the top of both vertex and fragment shaders. Other implementations default to `mediump`.

**Fix**: Add to the top of every shader string:
```glsl
precision mediump float;
```

---

## Three.js

### `THREE.Color.set()` does not accept RGB float components
**Symptom**: Emissive glow on Pokéballs was near-black instead of the intended color.  
**Root cause**: `color.set(r, g, b)` treats the first argument as a hex integer — `set(1.0, 0.25, 0.25)` = hex `0x000001` = near-black.  
**Fix**: Use `color.setRGB(r, g, b)` for float RGB components.

---

## React Three Fiber / Drei

### `<Environment>` overrides custom background shaders
**Symptom**: Adding `<Environment preset="sunset">` replaced the custom `EncounterBackground` shader with the HDRI skybox.  
**Fix**: Pass `background={false}` to prevent Environment from touching the scene background while still providing IBL lighting:
```jsx
<Environment preset="sunset" background={false} />
```
Wrap in `<Suspense fallback={null}>` so CDN failures (common on school networks) degrade silently.

---

## CSS / Shader Color Values

### CSS-style dark palette colors look black in WebGL
**Date**: 2026-03-01  
**Symptom**: Type-palette colors designed for CSS radial gradients (`#0a1a0a`, `#1a0500`, etc.) appeared completely black when used as GLSL `vec3` uniform values.  
**Root cause**: Colors like `#0a1a0a` are ~4% brightness — fine as a CSS dark background, but indistinguishable from black inside a 3D canvas where the renderer doesn't apply gamma correction the same way a browser does.  
**Fix**: Use saturated, mid-to-high brightness colors for 3D shader palettes. What looks "dark and moody" in CSS needs to be roughly 30–60% brightness to read in WebGL.

---

### GLSL ES 1.00: no variable declarations inside `if` bodies
**Date**: 2026-03-01  
**Symptom**: Shader compiled fine in desktop Chrome, but produced a completely black output in Safari / mobile WebGL.  
**Root cause**: GLSL ES 1.00 (WebGL 1) does not allow variable declarations inside conditional (`if`) blocks on many drivers. The block still parses without a visible error, but silently produces undefined/black output:
```glsl
// BAD — will silently break on strict GLSL ES 1.00 drivers
if (uCloudAmt > 0.01) {
  float cx = wx * 0.65;  // ← declaration inside if body = undefined behaviour
  float cloud = vnoise(vec2(cx, 0.0));
  sky = mix(sky, cloudCol, cloud);
}
```
**Fix**: Declare ALL local variables at the top of `main()`, then use the uniform as a multiplier instead of a branch guard:
```glsl
// GOOD
float cx    = wx * 0.65;
float cloud = vnoise(vec2(cx, 0.0));
sky = mix(sky, cloudCol, cloud * uCloudAmt);  // uCloudAmt=0 → no clouds
```

---

## Dev Server

### Stale Vite processes squat on ports across restarts
**Symptom**: `npx vite --port 8001` reports "Port 8001 is in use" and increments to 8002, 8003, etc., causing the browser to be pointed at a stale server.  
**Fix**: Before starting a new dev server, kill all existing Vite processes:
```bash
pkill -9 -f "vite"
```
Or kill specific ports:
```bash
kill -9 $(lsof -nP -iTCP:8001 -sTCP:LISTEN | awk 'NR>1{print $2}')
```

---

## React Three Fiber

### Driving orthographic camera zoom from React state without remounting
**Date**: 2026-03-01  
**Problem**: Passing `camera={{ zoom: stateValue }}` to `<Canvas>` only sets the *initial* zoom; R3F does not re-apply those props after mount.  
**Fix**: Create a tiny inner component that calls `useThree` and imperatively updates the camera:
```jsx
function CameraZoom({ zoom }) {
  const { camera } = useThree();
  useEffect(() => {
    camera.zoom = zoom;
    camera.updateProjectionMatrix();
  }, [camera, zoom]);
  return null;
}
// Inside <Canvas>:
<CameraZoom zoom={zoom} />
```

### `<Environment preset="sunset">` adds a warm colour cast to all models
**Date**: 2026-03-01  
**Symptom**: Pokémon looked washed-out / orange-tinted despite having correct diffuse textures.  
**Root cause**: The sunset HDRI is heavily orange; that colour is multiplied into every `meshStandardMaterial` through the environment map.  
**Fix**: Switch to a neutral preset and reduce intensity:
```jsx
<Environment preset="city" background={false} envMapIntensity={0.6} />
```
Also lower `<ambientLight intensity>` (~0.9) to restore shadow contrast.

---

## CSS / Layout

### Two WebGL canvases cannot share rendered content
**Date**: 2026-03-01  
**Problem**: Tried to zoom world-map Canvas and overlay encounter Pokémon on top. Result: two independent composited frames — tap events still reached the map, z-fighting, wrong perspective.  
**Fix**: Keep them fully separate. Use CSS `linear-gradient` for encounter sky/ground; make encounter Canvas `alpha:true` + `gl.setClearColor(0,0,0,0)` so the gradient shows through.

### Pinch-to-zoom on a React Three Fiber Canvas wrapper
**Date**: 2026-03-01  
**Fix**: Add `onTouchStart/Move/End` to a wrapper `<div>` **outside** the Canvas. Track initial two-finger distance + starting zoom in a `useRef`; compute `scale = newDist / startDist`; call `setZoom(clamp(startZoom * scale))`. Call `e.preventDefault()` in `onTouchMove` to block page-scroll. Do NOT attach inside the Canvas — R3F intercepts pointer events for its own raycasting.
