# Modernization workbench (in progress)

This is an **early scaffold**, not a working skeleton demo. It registers a 5.1 RenderNode and implements independently testable metric path sampling and frame-independent locomotion.

## Commands
```sh
npm install
npm test
npm run dev
npm run build
```

## Remaining blockers
1. Confirm package/API compatibility and RenderNode lifecycle in an actual browser.
2. Implement a Three.js WebGL renderer sharing the ArcGIS context, correct framebuffer binding, camera matrices, local-origin handling and GL state restoration. The current RenderNode **does not draw the diagnostic mesh**.
3. Convert the historical marine animations to glTF/GLB and verify redistribution permissions.
4. Derive heading from path tangent in the ArcGIS local tangent frame; remove asset-axis ambiguity.
5. Calibrate walk/run clip distance per cycle and validate foot sliding visually.

The original root `index.html` remains unchanged. No license has been added.
