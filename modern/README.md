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
or lists exported animation clips; use Start, Pause, Reset and Speed to experiment.

## Verification / limitations

- GLTFLoader + AnimationMixer are wired to Soldier.glb.
- Whether this Soldier model has suitable idle/walk/run clips, axes, or compatible
  gait stride has **not yet been inspected or visually validated**.
- The RenderNode/Three.js shared WebGL context is experimental and must be
  tested in a browser before the PR can be merged.
- The legacy Marine source files remain untouched. No repository license added.
