# externalRendererSkeleton

**[▶ Live Demo — Open in GitHub Pages](https://nicogis.github.io/externalRendererSkeleton/)**

ArcGIS Maps SDK for JavaScript **5.1** + Three.js **RenderNode** sample with animated **Soldier.glb**, manually drawn 3D routes and an activity dashboard.

The current Vite project lives at the **repository root**. The historic ArcGIS 4.1 / legacy Three.js implementation was removed from the current source tree during modernization and remains available in Git history.

## Develop and build

Requires Node.js 22+.

```sh
npm install
npm test
npm run dev
npm run build
```

Vite produces `dist/`. Publish **the contents of `dist/`** to your IIS virtual folder (for example `/skeleton/`), not the source directory. The build uses Vite `base: "./"` for relative production asset URLs. It emits `dist/models/Soldier.glb` from `models/Soldier.glb`, and copies `public/web.config` to `dist/web.config` for IIS GLB MIME support.

**GitHub Pages:** The `.github/workflows/ci.yml` workflow tests and builds the app, then deploys the compiled `dist/` directory after each push to `master` (or manual workflow dispatch on `master`). Pull requests only run the build and tests. Once, in the repository's **Settings → Pages → Build and deployment**, select **GitHub Actions** as the source. The expected Live URL is https://nicogis.github.io/externalRendererSkeleton/. GitHub Actions must be enabled and the `github-pages` deployment environment must allow `master`. `dist/` stays ignored by Git; do not commit it.

## Controls

1. Click **Draw route** and draw points along the desired road or trail; double-click to finish (**Esc** cancels).
2. The app samples elevations along the polyline, draws the route, and places the Soldier at its beginning.
3. Press **Focus Soldier** then **Start**. **Pause** and **Reset** control animation; Speed selects walking/running.
4. **Route display** has **Completed / remaining** (orange versus cyan), **Reveal as you move**, and **Thin line** modes.
5. **Activity Monitor** displays progress, moving time (pauses excluded), distance, speed, pace, positive/negative elevation change and an adjustable-weight approximate MET calorie estimate. Heart rate is unavailable without a sensor.

**Clear route** deletes the drawn path and hides the Soldier. No hardcoded sample route is used. Route drawing is manual rather than navigation-network snapping; terrain elevation comes from ArcGIS ground DEM.

## Notes

- The Soldier GLB is the current animated asset; the original legacy Marine model is not part of the current application.
- Rendering shares the ArcGIS WebGL context with Three.js. Keep the framebuffer order `renderer3.resetState(); this.bindRenderTarget();` intact.
- MET calories are illustrative, not measured fitness or clinical data. Gait synchronization and foot clearance require visual calibration on different terrain.
- No license file is included.
