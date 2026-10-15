# Modern ArcGIS 5.1 / Three.js workbench

> **Experimental / not browser-validated.** The original ArcGIS 4.1 demo remains unchanged on `master`.

## Run locally

Requires Node.js 22+.

```sh
cd modern
npm install
npm test
npm run build
npm run dev
```

Open the URL printed by Vite (usually http://localhost:5173).

## Status

- Scene component, Three.js RenderNode prototype and diagnostic capsule are implemented.
- Distance-based locomotion, path-tangent heading and GLTFLoader / AnimationMixer integration are implemented.
- A GitHub Actions workflow now runs tests and a production build.
- **The original Marine model is NOT converted to GLB.** The historical demo loads `models/skinned/marine/marine_anims_core.json`, an old Three.js BlendCharacter asset. A glTF export requires access to the original mesh, skin, animation data and textures, plus verification of redistribution terms. Do not rename the legacy JSON to GLB.
- Until a valid GLB is provided, the diagnostic capsule is displayed. This does not validate foot sliding or animation fidelity.
- The RenderNode/Three.js shared-context behavior still needs an actual WebGL browser test. RenderNode is an experimental Esri API.

## Supplying a converted model

Place an authorized `marine.glb` at `modern/public/models/marine.glb`, then configure `modelUrl: "/models/marine.glb"` in `src/main.js`. Ensure the exported clips are named with `walk`, `run`, and `idle` and calibrate `clipMetersPerSecond` in `src/renderer.js`. Validate model forward/up axes before changing their correction.

No repository license was added.
