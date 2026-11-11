# The Last Outlaw — Enhanced Fixed Edition

Updated 6 November 2026 in the existing `TheLastOutlaw_v2_FIXED` folder. The original game at `D:\TheLastOutlaw_v2 FOR TEST` remains unchanged. The launcher filename and location are unchanged. If the game is already open, reload it with F5.

## Changes requested in the screenshot

Enemy artwork has mixed native directions: for example, the thin gang member's idle/aim artwork faces left, while its walk frames face right. The renderer now accounts for the individual frame before applying the character's intended facing. This fixes idle, aiming, boss, and running poses instead of blindly flipping every enemy.

The HUD now separates health, weapon/ammunition, bounty, chapter title, and mission checklist. Ammunition has its own numeric area beneath the weapon name; money is in a different card and the chapter name is centered at the top. Long tutorial text is fitted to the available center space. Kill-streak feedback uses a separate line below the tutorial area.

Atmosphere now includes warm light around the player indoors, drifting dust/motes, and gentle edge shading. The original background art, weather and soundtrack are retained.

## Gameplay additions

- Guards announce a lane change for 0.8 seconds before repositioning.
- Bosses mark their target lanes before firing, giving the player time to react.
- The saloon duelist fires a follow-up shot; the mountain boss fires shotgun volleys.
- Outlaw's Run uses mounted player/enemy artwork, increased riding speed, and a 120-second interception objective. Hard mode reduces the timer to 96 seconds. Running out of time restarts the encounter.
- Devil's Engine has an illustrated steam war wagon with armor, warned cannon attacks, and a short vulnerable vent window. Shots must reach the vent's height while it is exposed. The new transparent wagon illustration is saved locally in `art/sprites/war_wagon_v3.png`.
- The Iron Marshal escalates from a single warned lane to multiple lanes and an all-lane volley at low health. The all-lane shot is jumpable; the cannon encounter instead leaves a safe lane.
- Quick kills form a streak and award extra bounty from the third kill. Damage breaks the streak.
- H on the title screen selects Standard or Hard. Hard increases received damage, accelerates enemy/boss attack cadence, and tightens the mounted timer.

## Checkpoint Continue

C on the title screen resumes saved progress. Saves retain the level, difficulty, checkpoint, defeated enemies, rescues, completed interactions, ammunition, weapon ownership and bounty. Continue returns the player to the checkpoint with full health; it does not save an exact combat frame. Before the first checkpoint it returns to the saved level's start.

Saves occur on checkpoints/interactions and periodically after a checkpoint. Storage failure is handled without crashing. Data stays in the same browser's local storage; different browser profiles or server ports have separate saves. Starting a new campaign replaces the save. The campaign save is removed after the ending. Test/debug/preview modes do not write campaign progress.

## Retained fixes and efficiency

The previous mission exit checks, height-aware swept collisions, ammo reset rules, timer isolation, pause/focus handling, music fallback, responsive landscape playfield, and debug-only level skips remain. Effects are capped at 260 active entries, and cached blurred background canvases are released between levels. These are bounded implementation changes, not a claim of measured GPU/frame-rate improvement.

The Windows launcher retains ASCII/CRLF batch formatting, preferred port 8831, loopback-only hosting, Python checks, and occupied-port fallback. Its console title now uses plain ASCII as well.

## Validation

**37 automated checks passed:** 34 engine regression checks and three launcher checks. Commands:

```text
node tests/engine.test.cjs
python -B tests/launcher_test.py
```

New regression coverage includes frame-facing conventions, runners' early-return facing, locked boss warnings, late Marshal lanes, armor/vulnerability phases, vent collision height, warned guard movement, mounted timeout, Hard-mode damage, checkpoint restore, invalid saved data, and bounded effects. The prior regression checks continue to pass, including Windows batch line endings.

The final gameplay build completed all 15 missions in both Standard and Hard in live Chromium simulations, reaching the ending with every required objective complete. The bot chose targets and lanes, fired, skipped cards, and invoked interactions. Normal health, ammunition, checkpoint recovery and enemy logic were used; no health/invulnerability was injected into these campaign simulations. These runs establish progression, not human difficulty or a manual playthrough. Randomized combat changes outcomes between runs.

A separate live reload test used the real C key and restored Black Gold Mine at x=3600 with 17 rifle rounds, $5,800 bounty, a completed objective, and a defeated enemy intact. Its temporary browser save was restored afterward. Visual fixtures were used to inspect the HUD, facing, mounted art and wagon; those screenshots are not evidence of a human playthrough. No errors/warnings were returned by the inspected browser console logs.

Evidence in the parent outputs folder:

- `upgraded-mine-hud.png`
- `upgraded-mounted-chase.png`
- `upgraded-war-wagon.png`
- `upgraded-campaign-standard.json`
- `upgraded-campaign-hard.json`
- `upgraded-checkpoint-resume.json`

## Remaining scope

Touch/gamepad input, remappable controls, comprehensive accessibility options, other-browser/hardware testing, human balance testing, and perceptual audio review remain outside this pass. The new chase is a timed mounted interception mission; it does not add a separate moving-convoy simulation. The wagon and Marshal are playable encounter upgrades rather than new cinematic sequences.


## Lossless itch.io packing — 11 November 2026

Current working folder: `D:\TheLastOutlaw_v3\outputs\TheLastOutlaw_v2_FIXED`.

- Replaced all 299 PNGs under `art/` with lossless WebP using Pillow's
  `lossless=True, exact=True, method=6, quality=100`. Exact mode preserves RGB
  values even in fully transparent pixels. Every decoded RGBA byte matches.
- Replaced the six PCM16 WAVs with PCM16 FLAC at the original sample rates,
  channel counts, and frame counts. Every decoded integer sample matches.
  No resizing, palette reduction, dithering, resampling, or lossy encoding was used.
- Updated the engine, campaign, sprite and muzzle manifests, and regression
  fixtures to the new filenames. Campaign values and gameplay are unchanged.
- On WebCodecs-capable browsers, the image loader decodes straight RGBA into a
  canvas before drawing. This avoids Chrome's native WebP alpha-premultiplication
  rounding difference. The title, hero, and translucent wagon render with exactly
  the same canvas pixels as their original PNGs in the tested Chrome build.
  Browsers without WebCodecs use native lossless WebP decoding; exact canvas
  equivalence has only been verified in Chrome, not across all browser engines.
- Added `Loading… X%` over the title artwork. The percentage counts completed
  image loads/decodes and sound downloads; keyboard/mouse play starts only after
  loading completes. Audio bytes are prefetched and decoded by the existing
  user-gesture sound path. A failed asset shows an error and Reload button.
  Later-level scenery is released from the game's image cache after preload.
- Added a relative root `index.html` redirect to
  `maker/engine.html?game=sundown_trail`.
- Restored required ASCII/CRLF batch-file line endings after the baseline
  launcher formatting test failed; `.gitattributes` preserves CRLF on checkout.
- Validation: 36 engine checks and 3 launcher checks pass. Chrome was exercised
  inside a nested `/itch-build/` iframe: loading progress reached 100%, early
  input was blocked, failed downloads showed Reload, the title/gameplay rendered,
  all 15 levels initialized and drew, and every referenced asset returned HTTP 200.
  All six FLACs also decoded to the exact same floating-point PCM arrays as the
  WAVs in the browser. The actual sound path loaded all six buffers and played
  them with a running AudioContext; no perceptual listening review is claimed.
- Exact comparison hashes and browser results are in
  `tests/lossless-verification.json` and `tests/lossless-browser-verification.json`.
- `outputs/the-last-outlaw-itch.zip` has `index.html` at its root. Packaging
  excludes `.git`, `tests`, `outputs`, Python files, batch files, and other ZIPs.
  Upload it to itch.io as an HTML game. This remains a keyboard game.


## Desktop-only notice (2026-11-12)

Small touch devices with a coarse primary pointer now see a full-screen keyboard
notice over the existing title artwork. The early gate places all subsequent
game markup in an inert template, preventing game scripts, level data, sprites,
and audio from loading. Devices with a fine primary pointer keep the original
engine path, including touch-enabled laptops using a mouse or trackpad.
The gate uses the physical screen's shorter side (at most 1024 pixels), so
landscape phones and larger tablets remain covered.

Validation: all 36 engine regressions and 3 Python launcher tests passed.
`node tests/device-gate.test.cjs` passed in headless Chrome with Playwright:
390x844 phone, 844x390 landscape phone, 1366x1024 tablet, 1280x720 desktop,
narrow desktop, and a touch laptop with a fine primary pointer. Both index and
direct engine entry points were checked on mobile. Network requests were limited
to HTML and the title WebP; there was no game canvas or game API on mobile.
The desktop title screenshot was pixel-identical to main at 46f58f2, and keyboard
startup worked. The existing automated combat simulation completed all 15 levels
with normal health, ammo, enemies, and checkpoint rules (automated targeting and
lane assignment, with intro cards skipped).

The itch ZIP was rebuilt with index.html at its root, including the README.md
platform notice and the unchanged art/audio. Tests and development files are
excluded as before. The unfinished area/mobile-touch branch remains unmerged.


## Instant root loading and frame fit — 12 November 2026

- Root `index.html` now paints the existing title art, Loading… 0% and progress
  bar before requesting the engine. It hosts a full-size same-origin iframe,
  mirrors real completed-asset percentages/errors, and stays visible until the
  engine explicitly draws its ready frame. No redirect or blank handover.
- Both loaders contain the title image without cropping. The canvas retains its
  full 1600×941 logical playfield with a uniform scale bounded by both backing
  dimensions, including fractional device pixels. Existing letterboxing and
  phone control rails remain. Gameplay, assets, and controls are unchanged.
- Validation: 38 desktop engine regressions, 41 touch-host regressions, and all
  3 launcher tests passed. New `tests/frame-loading.test.cjs` passed in headless
  Chrome at 960×540 and 1280×720 desktop and 740×360 touch phone emulation.
  It checks the root loader with the engine request held, real progress with a
  sound request held, blocked early input, ready handoff, nested embed paths,
  full canvas bounds, keyboard and actual CDP multi-touch move/sprint/shoot,
  jump, gun button, pause, 1920×1080 resize, the Fullscreen API, all 15 scene
  renders, direct engine entry, and failed-download retry. The existing campaign
  simulation reached the ending in both Standard and Hard with normal combat
  rules (automatic targeting/lane assignment; no human playthrough claimed).
- Run: `node tests/frame-loading.test.cjs` with Playwright installed (or the
  bundled Codex Playwright runtime). Optional GAME_ROOT and QA_OUTPUT variables
  select the served build and screenshot/result directory. Browser evidence is
  written under outputs/browser-loading by default and excluded from releases.
- Release: `D:\TheLastOutlaw_v3\the-last-outlaw-LIVE.zip`, index.html at root;
  excludes .git, tests, outputs, Python, batch, ZIPs, and development metadata.
  The archive is byte-verified against source and tested after extraction.
- Limits: local nested-iframe/Chrome emulation and headless fullscreen checks;
  no physical phone or live itch.io upload was performed in this pass. Existing
  art files were not modified. The prior mobile-paused/desktop-only history
  above is historical; current main already supplies the phone thumb stick UI.
