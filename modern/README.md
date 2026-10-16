# ArcGIS 5.1 + Three.js RenderNode prototype

The modern workbench loads the existing repository file `models/Soldier.glb`.
It is a **Soldier** asset, not the original legacy Marine. Vite serves it at
`/models/Soldier.glb` during development and includes it in production builds
without duplicating the model in the Git repository.

## Run

Requires Node.js 22 or later.

```sh
cd modern
npm install
npm test
npm run build
npm run dev
```

Open the URL displayed by Vite. The status area reports model loading errors
or lists exported animation clips. The Soldier remains hidden until a route is drawn. Use Start, Pause, Reset and Speed after completing the route.

## Verification / limitations

- GLTFLoader + AnimationMixer are wired to Soldier.glb.
- Whether this Soldier model has suitable idle/walk/run clips, axes, or compatible
  gait stride has **not yet been inspected or visually validated**.
- The RenderNode/Three.js shared WebGL context is experimental and must be
  tested in a browser before the PR can be merged.
- The legacy Marine source files remain untouched. No repository license added.

## Draw your own route

Press **Draw route**, click along a road or trail and **double-click** to finish. The app samples ArcGIS terrain elevations along the resulting polyline, draws a cyan ground-level line, resets the Soldier to the new start and lets **Start** animate along the new path. Use **Focus Soldier** to inspect the new start, and **Clear route** to remove the route and hide the Soldier until another one is drawn. **Esc** cancels drawing. This is manual tracing, not automated routing or snapping to a road network.

## Route visualization and Activity Monitor

Use **Route display** to switch between:

- **Completed / remaining** (default): completed path in orange, remaining route as a thin transparent cyan line.
- **Reveal as you move**: only show the portion already traversed.
- **Thin line**: retain an unobtrusive complete route.

The **Activity Monitor** can be collapsed using its title. It displays active time (excluding pauses), distance, current speed, pace, terrain ascent/descent, approximate calories based on adjustable weight and a simplified MET model, and progress. The caloric figure is *an estimate*, not a measured value; heart rate stays unavailable without a connected sensor. New routes and Reset clear activity counters. No browser storage or server data collection is used.
