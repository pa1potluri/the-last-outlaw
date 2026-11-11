# The Last Outlaw — Complete History and Developer Handoff

Last updated: **6 November 2026**, Asia/Calcutta.

This is the standalone record of what was inspected, fixed, added, tested, and left for future work. It is intended for the owner, Claude, Codex, or another developer continuing the game. It records the work completed in this chat; it is not an instruction to publish, replace files elsewhere, or contact another person.

## 1. Which version and folder to continue

**Continue development in this folder:**

```text
C:\Users\PKP\Documents\Codex\2026-11-06\d-thelastoutlaw-v2-for-test\outputs\TheLastOutlaw_v2_FIXED
```

**Original supplied game, preserved unchanged:**

```text
D:\TheLastOutlaw_v2 FOR TEST
```

The supplied README called the original “version 2.” No earlier version-1 build was supplied or compared. In this history, “original” or “first build” means that supplied v2 folder. “Fixed Edition” and “Enhanced Edition” describe the subsequent work, not formal release version numbers. The `v3` in the new wagon asset filename and save schema does not mean the entire game has been formally released as v3.

The owner's priorities were to test the game and plot thoroughly, preserve the original for comparison, correct defects, make missions meaningful, fix enemies facing the wrong way, prevent HUD text from covering ammunition, and make the game more atmospheric, enjoyable, efficient, and challenging.

The original plot, title, mission descriptions, existing artwork, and sound files were retained. Additional objective data, game logic, presentation, and a new wagon illustration were added in the fixed copy.

## 2. How to launch and play

Double-click this file in the current game folder:

```text
Play The Last Outlaw.bat
```

It runs `launch_game.py`. Python 3 and a desktop browser are required; Node is needed only for developer tests. Keep the launcher console open while playing. Ctrl+C in that console stops its server. If the game is already open, F5 loads updated game files.

The launcher prefers:

```text
http://127.0.0.1:8831/maker/engine.html?game=sundown_trail
```

The original batch launcher used port 8830. The fixed launcher binds only to loopback, checks for Python, starts a ready HTTP server, and opens the default browser. If 8831 is occupied, it uses an available port and prints the address. Another port/browser/profile has separate local-storage saves. Do not open `engine.html` directly with a `file://` URL: the game loads JSON and assets through HTTP.

| Context | Controls |
|---|---|
| Title | Space / Enter / click starts a new campaign; C continues a save; H selects Standard or Hard |
| Movement | A/D or Left/Right; Shift sprints or spurs the horse |
| Lane / jump | W/S or Up/Down changes lane; Space jumps |
| Combat | J or hold mouse fires; Q or 1–5 switches weapons |
| Mission | E interacts with a nearby gold diamond in the same lane |
| Sound / pause | M mutes; P / Escape or the screen button pauses/resumes |
| Level cards / ending | Space skips a card; Enter at the ending starts fresh |

Starting a new campaign replaces the one saved campaign. Standard and Hard share that save slot. This remains a desktop keyboard game, with no touch or gamepad controls.

## 3. Initial inspection and findings

The original was a browser Canvas run-and-gun game with readable source, not a compiled executable requiring decompilation. Its main files were a single HTML engine, a JSON campaign, sprite/muzzle manifests, PNG art, WAV sounds, a batch launcher, and a short README.

The initial asset audit found **310 files, 51 sprite definitions, and 298 unique referenced asset paths**, with no missing referenced paths. All six supplied action WAVs fetched and decoded. That path audit did not mean background music existed: music paths were constructed by code, no music directory/tracks were supplied, and the procedural soundtrack's enabling flag was absent.

The campaign had 15 levels and a working ending. Original testing found these important defects and gaps:

1. Exit checks required only major enemies to die; ordinary bandits and stated story objectives could be skipped. Muddy Creek cleared with all three villagers unrescued. Dry Gulch cleared with 11 ordinary enemies alive after removing its guard.
2. Player bullets checked lane and horizontal position but ignored height. A z=500 bullet could hit a grounded enemy.
3. Fast bullets checked only their new position. A controlled rifle trajectory hit at 60 FPS but skipped its target at 20 FPS.
4. A fresh campaign inherited depleted ammunition from the previous run.
5. Delayed barrel-chain callbacks could damage enemies in another level after a restart/change.
6. Missing file music and a disabled procedural fallback left no working background soundtrack.
7. Height-only scaling and fixed title font sizes clipped text in narrow/tall windows.
8. Shift+N/B allowed unrestricted level skipping.
9. Input state was not cleared on focus loss; there was no defined pause or persistent resume.
10. Repeated keydown events could repeatedly toggle sound or cycle weapons/lanes.
11. The launcher assumed Python, opened the browser before server readiness, and used one fixed port.
12. Several plot promises were not implemented as mechanics: rescues/documents/gold/factory goals, horseback pursuit, the war wagon, and a distinctive final duel.

The complete original audit is in the parent folder as `The-Last-Outlaw-QA-Report.md`. It describes the original build and must not be treated as the current build's defect list: many of those findings were subsequently fixed.

## 4. First correction pass — separate Fixed Edition

A full playable copy was created in `TheLastOutlaw_v2_FIXED`; the original D: folder was not edited.

### Missions and progression

- Added explicit mission state and one shared `canExit()` predicate for the movement limit, gate appearance, and level-completion check.
- Added a MISSION checklist, gold-diamond markers, same-lane/range/grounded E interactions, and completion feedback.
- Required the appropriate rescues and story-object interactions before opening exits.
- Required every bandit to be defeated in Dry Gulch and Blood Red City.
- Added supplies, gold, documents, ledger, factory sabotage, ammunition-store, convoy-supply, and engine-disable interactions matching existing mission text.
- Interactions award bounty once; repeated use cannot collect the same reward again.
- Allowed travel back to the left to finish missed goals.
- Checkpoint recovery preserves completed interactions, rescued villagers, and defeated enemies; a full level retry resets the mission with the restarted enemies.

### Combat and state

- Replaced point-only projectile collision with height-aware swept segment/body collision.
- Processed impacts in travel order, including crates, barrels, enemies, player hits, range limits, and rifle piercing.
- Fixed bullets hitting above/below character bodies and fast shots tunneling through targets.
- Separated fresh-campaign inventory reset from level-retry ammo restoration and checkpoint behavior.
- Replaced gameplay `setTimeout` callbacks with run-scoped timers that advance with gameplay and freeze during pause.
- Cleared old timers on restart and stopped an old projectile/explosion update if it caused a new run to start.

### Audio, display, controls, startup

- Enabled the existing procedural soundtrack; optional file tracks fall back on failure.
- Added a manifest for the six supplied sounds so missing sound variants are not repeatedly requested.
- Added a stable landscape playfield with letterboxing and fitted title text; portrait windows show a keyboard/landscape notice.
- Added P/Escape and an on-screen pause/resume button; focus loss clears held keys and pauses.
- Prevented repeated toggle actions and default Enter activation from interfering with an ending restart.
- Restricted level-skip keys to an explicitly labelled `&debug` mode.
- Added `launch_game.py` with Python-aware batch startup, ready-server browser opening, loopback-only serving, and port fallback.
- Added engine regression tests and launcher tests.

The first fixed pass reached 24 automated checks before the packaging follow-up below. Initial and fixed campaign simulations reached the ending, with the limitations described under testing.

## 5. Launcher failure reported by the owner — root cause and correction

The owner could not run the supplied batch file. An actual `cmd.exe` check reproduced a silent exit.

**Root cause:** the batch file had been saved with carriage-return-only line endings, rather than Windows CRLF. The earlier mocked launcher tests did not exercise the actual batch-file packaging.

**Correction:** rewrote the batch file as ASCII with CRLF line endings. Actual batch startup was then verified with browser opening stubbed during the diagnostic. The server returned HTTP 200 for the HTML engine, campaign JSON, sprite manifest, and player sprite. Added a regression check for batch-file formatting, bringing that stage to 25 checks.

**Do not regress this:** preserve ASCII/CRLF when editing `Play The Last Outlaw.bat`. Do not assume Python unit tests alone prove a Windows batch file launches correctly. The launcher console title was later changed to plain ASCII too.

## 6. Screenshot-driven improvements — current Enhanced Edition

The owner supplied a Black Gold Mine screenshot showing enemies looking away and chapter/bounty text covering the ammunition area, and authorized visual/gameplay improvements.

### Correct enemy facing

The source frames do not share one native direction. Some gang idle/aim frames face left while walking or other aiming frames face right. A global flip cannot fix this reliably.

Added reviewed per-frame native-direction metadata (`LEFT_FRAMES`, `frameFacing`, `spriteFlip`) and applied it in the sprite renderer before the requested facing transform. Moved runner-facing updates before early movement returns. Enemies now turn toward the player across reviewed idle, aiming, running, and boss poses, including when the player passes them. Future added frames must have their native orientation checked.

### HUD and atmosphere

- Split health, weapon/ammo, bounty, chapter title, and mission objectives into separate areas.
- Moved chapter number/name to the top center. “6/15” is the chapter count, not an ammunition or version value.
- Gave ammo its own numeric line beneath the weapon name, independent of bounty and chapter text.
- Fitted long tutorial text to the available center space and put kill-streak feedback on a separate line.
- Added warm indoor light around the player, drifting motes/dust, and restrained edge shading; retained the original environments/weather.

### More varied, challenging combat

- Guards announce a lane change for 0.8 seconds before repositioning.
- Bosses lock and mark target lanes before firing, offering readable counterplay.
- The saloon boss fires a follow-up shot; the mountain boss fires shotgun volleys.
- Outlaw's Run uses existing mounted hero/enemy art, increased riding speed, a 120-second interception timer, and a retry on timeout. Hard mode reduces this to 96 seconds.
- Added an illustrated steam war wagon with armor, warned cannon shots, a short exposed-vent window, and a vent-height collision requirement.
- The Iron Marshal escalates from a single warned lane to multiple lanes and an all-lane volley at low health. Its all-lane shot is jumpable. Wagon cannon attacks instead leave a safe lane.
- Quick kills form a streak with bonus bounty from the third kill; taking damage breaks it.
- Added Standard/Hard selection with H on the title. Hard increases received damage, accelerates attack cadence, and tightens the mounted timer.

The chase is a **timed mounted interception mission**, not a new independently simulated moving convoy. The wagon/Marshal are playable encounter upgrades, not new cinematic sequences.

### New asset

Created and integrated one transparent illustrated wagon sprite using image generation:

```text
art/sprites/war_wagon_v3.png
```

The game references its local copy, not an external generation-service path. Original art/sounds remain unchanged. Runtime-generated hatch/glow/warning overlays indicate armor and vulnerability.

### Checkpoint autosave / Continue

- Added C on the title to continue a saved campaign.
- Retains level, difficulty, checkpoint status, defeated-enemy flags, rescued-villager flags, completed interactions, ammo, weapon ownership, and bounty.
- Returns to the checkpoint with full health; before the first checkpoint, returns to the saved level's start.
- Saves at checkpoints/interactions and periodically after a checkpoint.
- Uses browser local storage under key `last-outlaw-fixed-v3`, with schema version 3.
- Handles missing/invalid/inaccessible storage without crashing.
- Starting a new campaign replaces the save; reaching the ending removes it.
- Test/debug/preview modes do not write or clear campaign storage.

This is checkpoint resume, **not exact mid-frame combat restoration**. Browser profiles and origins/ports have separate saves. Clearing browser data removes progress. No pre-upgrade persistent-save format existed to migrate.

### Efficiency

- Capped active visual effects at 260.
- Released cached blurred background canvases between levels.
- Kept developer/test behavior isolated from normal play and save writes.

No real-time GPU/frame-rate improvement was measured; these are bounded implementation changes, not a benchmark claim.

## 7. Current campaign rules

All exits still require applicable leaders/bosses to be defeated, plus the listed goals.

| Chapter | Level | Added/enforced mission goals |
|---|---|---|
| 1 | Dry Gulch | Defeat every bandit |
| 2 | Muddy Creek | Rescue all three villagers and recover supplies |
| 3 | Redstone Canyon | Recover the gold shipment |
| 4 | Ghost Town | Find the gang ledger |
| 5 | Dead Man's Saloon | Defeat the duelist and free the informant |
| 6 | Black Gold Mine | Recover gold and sabotage the weapons factory |
| 7 | Iron Horse Express | Recover train gold |
| 8 | Thunder Fort | Take secret documents |
| 9 | Cypress Hollow Swamp | Secure the ammunition store |
| 10 | Frostbite Pass | Defeat the mountain boss and rescue the engineer |
| 11 | Moonshadow Fort | Free the prisoner and take battle plans |
| 12 | Outlaw's Run | Mounted timed mission; defeat the leader and intercept convoy supplies |
| 13 | Devil's Engine | Defeat the armored wagon and disable the engine |
| 14 | Blood Red City | Defeat every bandit |
| 15 | The Last Outlaw | Defeat the escalating Iron Marshal and reach the ending |

## 8. Project map for the next developer

Paths below are relative to this game folder.

| File | Purpose |
|---|---|
| `maker/engine.html` | Main game: inline JavaScript state, inputs, physics, combat, objectives, drawing, audio, saves, encounter patterns, developer hooks |
| `maker/games/sundown_trail/game.json` | Campaign, original plot/mission text, placements, backgrounds, objectives, boss patterns, chase flags/timer, audio manifest |
| `art/names.js` | Original sprite/animation manifest |
| `art/muzzle.js` | Player muzzle positioning metadata |
| `art/sprites/` | Original sprite PNGs plus the new wagon asset |
| `art/trail/cut/` | Existing layered environment art |
| `sounds/` | Six supplied action WAVs |
| `launch_game.py` | Local HTTP server and browser startup |
| `Play The Last Outlaw.bat` | Windows entry point; keep CRLF/ASCII |
| `README.txt` | Current player instructions |
| `FIXES-AND-TESTS.md` | Current implementation/validation summary |
| `GAME_HISTORY_AND_HANDOFF.md` | This complete historical handoff |
| `tests/engine.test.cjs` | Actual engine executed in a lightweight Node DOM host; regression checks |
| `tests/launcher_test.py` | Launcher checks, including batch bytes |
| `tests/browser-combat-simulation.js` | Developer-console campaign simulation; resets in-memory progress |

Important engine helpers/state to locate before editing:

- `start`, `newCampaign`, `reloadGame`, `startId`, `levelAmmo`, `levelGun` — lifecycle/reset policy.
- `objectiveStatus`, `canExit`, `nearbyObjective`, `interactObjective` — mission consistency.
- `segmentHit`, `updateBullets` — height-aware swept collision and ordered impacts.
- `later`, `tickTimers` — pause-aware, run-scoped gameplay callbacks.
- `setPaused`, `clearInput` — pause/focus/input state.
- `LEFT_FRAMES`, `spriteFlip`, `sprite` — per-frame native facing.
- `updateGuardLane`, `bossWarningLanes`, `updateBossPattern`, `drawCombatWarnings`, `drawWarWagon` — encounter rules and presentation.
- `heroSpr`, `muzzle`, runtime mounted sprite definitions — riding presentation and projectile origins.
- `drawPlayerHUD`, `drawObjectiveHUD`, `drawAmbience`, `fitText` — interface and atmosphere.
- `readSave`, `saveProgress`, `resumeCampaign`, `storageEnabled`, `SAVE_KEY` — persistence and test isolation.

Some developer helpers are exposed on `window.G`. Browser regression probes also access top-level engine bindings through DevTools Runtime evaluation. Normal players do not need developer tools.

## 9. Testing completed and what the evidence actually proves

**Last recorded regression result: 37 automated checks passed — 34 engine checks and three launcher checks.** This summary-writing task did not rerun or change the game.

Run from this game folder:

```text
node tests/engine.test.cjs
python -B tests/launcher_test.py
```

Coverage includes all level initialization; objective gating and one-time rewards; projectile height, range, ordered piercing, crate/barrel/player collisions; rifle results at 20/30/60/120 FPS; campaign/retry ammo; timer isolation and death during dynamite processing; pause/weather/focus; checkpoint state; disabled normal-mode skips; repeated toggles; restart key behavior; reviewed frame orientation; boss warnings and phases; exposed-vent height; guard lane warnings; mounted timeout; Hard damage; save restore/invalid saves; effect limits; and completion of every mission after its requirements are met.

Live Chromium checks also completed:

- All 15 levels reached the ending in **Standard** and **Hard**, with required objectives completed.
- The campaign bot chose targets and lanes, fired, skipped cards, and invoked mission interactions. It used normal damage/ammo/checkpoint logic and no injected health/invulnerability.
- A real E-key check completed supplies while the exit remained blocked by unrescued villagers.
- A real C-key reload check restored Black Gold Mine at x=3600, 17 rifle rounds, $5,800 bounty, a completed objective, and a defeated enemy.
- Visual checks covered enemy orientation, the separated HUD, mine atmosphere, mounted art, the wagon, pause behavior, and tall/portrait letterboxing.
- No errors/warnings were returned by the inspected browser console-log checks.

**Limitations:** the campaign bots assign lanes directly, choose targets automatically, and do not represent human reaction time or difficulty. Some visual screenshots use controlled fixtures, including temporarily suppressed attacks/invulnerability; those are not campaign-playthrough evidence. Earlier original-game probes often injected enemy/bullet states to isolate defects. Randomized combat changes outcomes. There has been no uninterrupted manual human playthrough, broad hardware/browser certification, measured GPU performance study, comprehensive security audit, or perceptual audio-mix review.

## 10. Evidence and comparison files

These are in the **parent `outputs` folder**, one level above this game folder. They are not required to launch the game.

### Original audit / first correction pass

- `The-Last-Outlaw-QA-Report.md`
- `asset-and-campaign-audit.json`
- `runtime-test-results.json`, `browser-qa-probes.js`
- `combat-simulation-results.json`, `combat-simulation.js`
- `audio-decode-results.json`
- `fixed-combat-simulation.json`
- `01-title.png`, `02-train.png`, `03-dry-gulch.png`, `04-portrait-title.png`, `05-devils-engine.png`
- `fixed-mission-gameplay.png`, `fixed-portrait-title.png`

### Current enhancement pass

- `upgraded-mine-hud.png`
- `upgraded-mounted-chase.png`
- `upgraded-war-wagon.png`
- `upgraded-campaign-standard.json`
- `upgraded-campaign-hard.json`
- `upgraded-checkpoint-resume.json`
- `fixed-build-manifest.json`
- `fixed-source-changes.patch`

The manifest identifies the current revision and hashes recorded at the last implementation pass. The text patch compares changed original text files; **it is not a complete install package** and does not contain the new wagon PNG or all newly added launcher/test/document files. Use the whole current game folder when handing the project to another machine/developer.

Original engine SHA-256, retained for comparison:

```text
0628567004e697d6c50d6b28536676fc508ac44f2b7c75a5edcb3311d5e2e008
```

## 11. Remaining work and honest limits

These are future work/review items, not claims that all were implemented:

1. **Human balance/playability review:** play every mission normally in both modes; measure deaths, ammo starvation, objective confusion, checkpoint fairness, and whether warnings are readable during busy scenes.
2. **Broader device/browser checks:** other browser engines, window sizes, slower hardware, long sessions, actual input latency and frame timing.
3. **Accessibility and input:** remappable keys, reduced motion/flashes, better semantic menus/text equivalents, controller/touch support if wanted.
4. **Save completeness review:** checkpoint resume does not serialize every combat object. In particular, partial enemy HP, projectile/timer state, pickup state, and uncollected weapon drops are not fully restored. Review the case where a defeated leader's weapon drop was not picked up before reload. This is a source-level follow-up concern, not a newly reproduced regression in this handoff task.
5. **Save portability:** browser-origin storage depends on the port/profile. Consider export/import or a stable save mechanism if frequent port fallback becomes a real problem. Version future save schemas deliberately.
6. **Deeper chase/world simulation:** a separately moving convoy, obstacles, capture/failure mechanics, and more interaction beyond the current mounted timed interception.
7. **Story delivery:** strengthen why each discovery leads to the next destination, the protagonist's motivation, the Marshal's role, mission payoffs and the ending. Current original plot/mission text has been preserved rather than comprehensively rewritten.
8. **Encounter polish:** human-tuned boss windows, rider shooting animation alignment, original sprite edge artifacts, additional wagon animation/destruction effects, and richer final-duel presentation.
9. **Audio polish:** listening-based music/SFX balance, repetitive sound fatigue, and optional authored music if the owner wants it.
10. **Maintainability/performance:** consider extracting the growing inline engine into modules, and profile before making additional optimization claims. Avoid changing tested reset, collision, timer and save behavior during a structural rewrite.

## 12. Suggested handoff workflow for Claude or another developer

1. Read this file, `README.txt`, and `FIXES-AND-TESTS.md`; inspect current code rather than treating historical audit line numbers as current.
2. Confirm the owner is running this fixed folder, not the original D: copy or an older extracted copy. Keep the launcher path stable unless a move is agreed.
3. Make a versioned backup or source-control checkpoint before the next implementation pass. The original preserved build is useful but is not a substitute for backing up the current enhanced state.
4. Run the existing 37 checks; record any environment differences instead of silently assuming an old result still holds.
5. Start the actual Windows batch launcher and check its CRLF bytes if startup behaves strangely. Do not terminate unrelated game servers.
6. Run isolated browser tests without overwriting the owner's real campaign save; use the test/debug modes and preserve/restore any temporary storage fixtures.
7. Test changes to mission gates, collision heights/travel order, run-scoped timers, facing metadata, HUD spacing, and checkpoint restore against their current regression cases.
8. Keep additions consistent with the illustrated Western art, original plot, and readable warned attacks. More HP or faster shots alone are not a complete encounter design.
9. Update this history and the current test summary after each version, separating implemented behavior, measured evidence, and unresolved suggestions.

The owner's request for this file was documentation only. No game behavior or existing assets were changed while writing this handoff.


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

## Mobile touch work paused at owner's request — 11 November 2026

Working folder: D:\TheLastOutlaw_v3\outputs\TheLastOutlaw_v2_FIXED.
Changes are saved on disk in maker/engine.html and tests/engine.test.cjs, but are NOT committed or pushed. The existing outputs/the-last-outlaw-itch.zip has NOT been rebuilt and still contains the previous release.

Implemented pending browser QA:
- Touch capability detection, landscape control rails with left/right, sprint, jump, shoot, weapon switch, lane up/down, and mission interaction.
- Touch menus for new game, continue, difficulty, sound, and restart; Jump becomes Skip on level cards.
- Independent pointer holds/capture, cancellation cleanup, keyboard/touch state separation, portrait rotate hint and pause, touch scroll/gesture suppression, safe-area spacing.
- Existing artwork files and PC key mappings unchanged.

Validation completed:
- Baseline: 36 engine tests passed.
- Updated: 38 engine tests passed in desktop host; 41 passed with TOUCH_TEST=1; all 3 launcher tests passed.
- Python on PATH is only a Windows Store alias. Use C:\Users\PKP\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe.
- Chrome 1280x720 controlled title and gameplay canvas captures before/after have identical SHA-256 hashes. This checks these rendered fixtures, not all desktop interactions.
- Before/after capture scripts and screenshots are in C:\Users\PKP\Documents\Codex\2026-11-11\work-in-d-thelastoutlaw-v3-outputs\work.

Still required before release:
1. Actual browser touch tests at 844x390 (multi-touch move/sprint/shoot, jump, gun switch, lanes, interaction, menu/continue/end, pause, cancellation, orientation and scrolling); inspect screenshots. No mobile browser QA has been performed yet.
2. Desktop keyboard/mouse browser interaction regression checks. Review layout on smaller touch viewports and safe-area behavior.
3. Review implementation and update README.txt, README.md and FIXES-AND-TESTS.md with final verified behavior and test evidence.
4. Run all tests after any fixes; rebuild outputs/the-last-outlaw-itch.zip with index.html at root, excluding .git/tests/outputs/Python/batch/other ZIPs; verify packaged game.
5. Commit exactly "[codex] mobile touch controls" and push to origin main (previously authorized, still pending).
6. Report itch.io upload settings: HTML game, ZIP played in browser, Mobile Friendly, landscape dimensions/orientation, fullscreen option. Official reference: https://itch.io/docs/creators/html5 . Verify exact available labels before final guidance.

Browser test tooling: bundled playwright is at C:/Users/PKP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright. Headless Chrome needed an approved sandbox escalation to launch. A task-owned Python HTTP server was started at 127.0.0.1:8842; check whether it is still running before starting another.
