# Modernization design: ArcGIS 5.1 + modern Three.js

This branch is an independent modernization effort. The original 2016/2017 demo remains on master.

## Goals
- Replace ArcGIS 4.1 Dojo/AMD loading with ArcGIS Maps SDK for JavaScript 5.1 ESM APIs.
- Evaluate and implement the ArcGIS 5.1 **RenderNode** extension point instead of porting the old `externalRenderers` adapter. Verify the exact 5.1 RenderNode API, render target ownership, depth compositing, WebGL state restoration, and lifecycle against official documentation before coding.
- Replace legacy Three.js skinning/BlendCharacter code with modern AnimationMixer and a verified compatible Three.js version.
- Convert the original animated marine assets to glTF/GLB only after verifying that animation clips and skeleton bind poses survive conversion.
- Eliminate hard-coded 90/10/315-degree world rotations.
- Remove frame-dependent movement and foot sliding.

## Coordinate and orientation model
1. Sample the geographic path by *distance*, not vertex index, in a known spatial reference.
2. Obtain the model's world position through the ArcGIS rendering coordinate transformation supported by the selected 5.1 rendering integration.
3. Compute a normalized tangent from points immediately before/after the current arc length, and obtain the local surface normal (up).
4. Project the tangent onto the tangent plane. Construct an orthonormal forward/right/up frame, taking the asset's actual forward axis into account through a single **asset-local correction** quaternion established during model import.
5. Convert the frame into a world quaternion, interpolate heading using slerp, and keep the character upright over terrain.
6. Never apply hard-coded geographic heading or pitch/yaw/roll values to hide an incorrect asset axis.

## Animation and distance synchronization
- Advance distance as `distanceMeters += speedMetersPerSecond * deltaSeconds`, clamping delta on tab resumption.
- Sample the polyline at the resulting distance and update the model transform.
- Use animation clips for idle, walk, and run with crossfades. Start with explicit speeds for each gait.
- Calibrate animation playback against the measured distance traveled per gait cycle: `animationTimeScale = worldSpeed / clipDistancePerSecond`.
- If source animations do not encode measurable foot travel, expose a documented gait calibration setting and validate visually; do not claim physically perfect foot locking.
- On pause or end-of-path, stop translation and transition to idle.
- Handle asynchronous model loading, rendering lifecycle, and cleanup explicitly.

## Delivery plan
1. Establish a Vite-based 5.1 scene with a minimal custom RenderNode and reproducible build; validate ArcGIS/Three.js WebGL context interoperability before adding the character.
2. Migrate and inspect the marine model, skeleton, clip names, forward axis and asset permissions.
3. Implement geographic path sampling, orientation and time-based motion as testable modules.
4. Integrate AnimationMixer, gait calibration and controls.
5. Verify in-browser, run automated tests, and configure GitHub Pages preview/deployment.

## Acceptance criteria
- No fixed world rotation offsets in the movement loop.
- Stable heading through turns, no abrupt flipping.
- Similar walking speed across different refresh rates.
- Walking feet show no obvious sliding at calibrated speed.
- Pause/resume and end-of-path behavior work.
- ArcGIS 5.1 and Three.js integration verified in a browser.
- No repository-wide license added.

**Status:** Design/specification only. This document does not claim the new implementation is complete or browser-tested.
