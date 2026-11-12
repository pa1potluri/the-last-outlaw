# Director review assets

- `cover-A.png`, `cover-B.png`, `cover-C.png`: 630 × 500.
- `cover-*-1260x1000.png`: corresponding 2× covers.
- `frame-A.png` through `frame-C.png`: full-resolution 3200 × 1882 canvas exports.
- `shot-1.png` through `shot-5.png`: 1280 × 720, no title or HUD overlays.
- `index.html`: all candidates and screenshots side by side; links to originals.

## Source and treatment

All scenes were rendered by the shipped `maker/engine.html` in Chrome with `?promo=1&debug=1&mute=1`. No generated/repainted scenery, sprites, muzzle flashes, or reactions. Engine artwork and gameplay rules are unchanged. Captures use the engine's test hooks for chapter, camera, player position, loadout, and elapsed simulation time, then export its canvas at 2× its logical 1600 × 941 resolution. These are staged engine captures, not a claim of an uninterrupted playthrough.

A: chapter 12, player starts at x3350 in lane 2, moves and fires twin revolvers for 0.27 seconds. Earlier enemies are marked defeated in capture memory to isolate the mounted opponent at x3805. The muzzle flash and opponent damage/hurt pose come from normal update/firing/collision logic. The sunset and galloping sprite are original engine art.

B: chapter 13, player x6500 in lane 1, camera x5900, fires at the armored war-wagon cannon. Other enemies are marked defeated only in capture memory for a clear boss composition.

C: chapter 7, player x825 in lane 1, camera x380; three simulation steps capture a revolver muzzle flash and bandit hit reaction on the roof.

Screenshots 4 and 5 show Dry Gulch and Frostbite Pass. Captures retain original weather, world objects, and scenery. Screenshot conversion trims a small strip from the top/bottom to reach 16:9, then downsamples. Covers crop the source frame and add only a subtle top shade and the existing title-screen treatment: bold Georgia, gold #ffcf6a, dark #1a0d06 outline. The 630 × 500 files are downsampled from their 1260 × 1000 counterparts.

## Promo flag

Open the root `index.html?promo=1` or `maker/engine.html?promo=1`. `promo=0` and absent flags retain normal UI. Promo mode suppresses HUD, tips, speech, floating text, health bars, objective/checkpoint indicators, combat prompts, pause overlays, DOM pause button, keyboard notice, and touch controls/menus. Keyboard controls and simulation continue normally, including P/Esc pause.

No director's pick has been applied.
