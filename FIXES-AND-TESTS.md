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
