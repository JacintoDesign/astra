# ASTRA — Orbital Observatory

A cinematic, interactive 3D space observatory built with Three.js and Vite. A procedurally modeled orbital habitat floats above a shader-generated planet. No downloaded models, textures, or audio assets are required.

## Run

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. `npm run build` generates the production site in `dist`; `npm run preview` serves it locally.

## Explore

- Drag to orbit; scroll or pinch to zoom.
- Choose Overview, Habitat, Solar arrays, or Reactor for an animated camera transition and system details. Keyboard shortcuts: **1–4**.
- Pause station rotation, switch to eclipse lighting, or enable quiet synthesized ambient audio.
- Press **H** for cinematic mode; **H** or **Escape** returns to the interface.

The scene includes a segmented rotating habitat with illuminated windows and structural trusses, a reactor, twelve photovoltaic wings with generated cell textures, radiator panels, a communications dish, docking modules, 2,400 seeded stars, a procedural ocean/continent/cloud shader, atmospheric glow, and bloom postprocessing.

The mission, spacecraft, and telemetry are fictional artistic concepts, not scientific measurements of Kepler–186f. Reduced-motion preferences disable automatic motion. Google Fonts are optional; local sans-serif fallbacks are provided. Requires a WebGL2-capable browser.

## Implementation

- `src/main.js`: procedural model, planet shaders, lighting, camera choreography, picking, shuttle, and audio.
- `src/geometry.js`: static geometry batching that preserves animated groups and world transforms.
- `src/style.css`: responsive interface and cinematic presentation.
- `tests/geometry.test.js`: checks world-space bounds, triangle count, selection metadata, and independent animated children after batching.

The station's **633 modeled meshes become 23 material batches**. The habitat and reactor remain independently animated. A supply tender follows a separate orbital route. The main canvas stops rendering while the page is hidden; sound remains opt-in and fades out when hidden.

## Verification

```sh
npm test
npm run build
```

Verified in the integrated browser: all four camera views, direct hotspot selection, eclipse lighting, cinematic mode and Escape exit, pause/resume, sound toggle, and the help dialog. The phone layout was checked at an effective 391 × 844 CSS pixels with no horizontal overflow. The browser reported no rendering errors after the batching pass.

Three.js postprocessing uses [EffectComposer](https://threejs.org/docs/pages/EffectComposer.html) with bloom and a final output pass. Geometry batching follows the [official geometry optimization approach](https://threejs.org/manual/en/optimize-lots-of-objects.html).
