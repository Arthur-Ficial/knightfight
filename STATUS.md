# Knightfight — final status

**Live:** https://knightfight.franzai.com · **Repo:** https://github.com/Arthur-Ficial/knightfight
**Build:** ~82 KB JS (29 KB gzip), loads fast, works offline after first load (PWA).

## Round 2 (+ addendum) — done and verified live
- **Real pixel art:** the scene renders into a low-res offscreen buffer and integer-upscales
  with smoothing off (one chunky pixel size for knights, background, FX). Quantised **banded**
  torch/moon light (hard steps, no soft glows), calmer muted palette, fewer/slower particles,
  CRT off by default.
- **Natural arms:** two-bone elbow IK that grips the hilt, a real guard stance (weight on the
  back foot), off-hand always employed, shoulders socketed under pauldrons, quantised sword angle.
- **Directional combat:** tap a screen quadrant to strike that direction; the enemy holds a
  shifting **guard direction** (strike the open side) and telegraphs its **attack direction** in
  the same pixel-symbol language (dodge the matching way). Colour = what, direction = where. Fed
  into combos + the Codex.
- **Anti-misfire:** boons and valor commit only on a deliberate **swipe-left** (tap just focuses).
- **Zero scroll, symbol-first:** title = animated ghost-hand gesture pictograms; Codex/Hall of
  Valor = symbol grids with rank pips; boon cards = icon + one stat line + rarity by colour/frame.
  Everything fits one screen at **390×844 and 375×667** (proven by automation).
- **Wordless first-run tutorial:** a ghost hand shows tap-to-strike, then the **matching** dodge
  direction for the incoming attack, and vanishes once you do it.
- **Five review agents** (UX, retro-fun, first-timer, impatient, min-maxer) → fixes incl. the
  tutorial dodge-direction bug, the never-consumed riposte-window exploit, dead slow-mo/haptics,
  parry unlocked by default. See `docs/PLAYTEST.md`.
- Gates green, selfplay still monotonic (novice < decent < expert, no wall), redeployed and
  re-verified live at both viewports with the service worker cleared first; zero console errors.

## Round 1 baseline below.

## Definition of Done — all met
- ✅ Live on HTTPS at knightfight.franzai.com (Cloudflare Pages custom domain that
  OVERRIDES the franzai.com wildcard parking record). Verified the served body contains
  the app and the strings `easyname`/`domainparking` are absent.
- ✅ Playable one-handed with GESTURES ONLY — no buttons anywhere. Tap/hold/swipe/two-finger/
  circle/pinch → recognizer → Intents → pure sim.
- ✅ Weighty combat: hit-stop, screenshake, sparks, blood decals, slow-mo kills/parries,
  readable white/gold/red telegraphs with a shrinking ring.
- ✅ 14 enemy archetypes appearing progressively, endless affix scaling after, each
  identifiable by silhouette + palette.
- ✅ 14 named combos, 32 boons, meta upgrade tree (gestures are earned), 7 easter eggs — all
  documented in `docs/EASTER-EGGS.md`.
- ✅ Gates green: `typecheck`, `lint`, `test` (37 tests, no mocks), `build`. `npm run selfplay`
  balance report checked in at `docs/BALANCE.md`. `capacitor.config.ts` ready for `npx cap add ios`.
- ✅ No placeholders, no TODOs, no "coming soon".

## Verification evidence (iPhone viewport 390×844, DPR 3)
Drove real synthetic pointer gestures on the LIVE site: entered a duel, landed hits, won a
duel, picked a boon, advanced a rung, and died to capture the death screen. **Zero console
errors, zero failed requests, nothing scrolls/zooms** (`scrollY=0`). Screenshots captured of
title, mid-fight (combo + riposte + weapon trail), boon pick and death screen.

## Two art/design gaps raised by Franz mid-review — both fixed and redeployed
1. **Fighters looked like stick figures.** Rebuilt the character renderer: full plate
   knights (great helm + visor + plume, pauldrons, heraldic breastplate, tassets, gauntlets,
   greaves/sabatons, cloth-sim cape), tapered volumetric limbs with joint bulk, warm torch-rim
   + cool moon-fill two-tone lighting, contact shadows, real weapon geometry (blade + fuller +
   crossguard + pommel) with a motion-blur trail and bright leading edge, per-archetype
   silhouettes (kite shield, halberd, crossbow, twin daggers, horned/crowned/beaked helms,
   hound, oversized boss), foot-planting (no skating), anticipation crouch + follow-through,
   spark shower + white impact flash + dust puffs, and background depth (far towers, castle
   wall, banners, drifting fog, foreground crowd). Confirmed live.
2. **Balance inversion + rung-7 wall.** Root-caused with `scripts/diag.ts` (see
   `BALANCE-INVESTIGATION.md`): the player closed slower than the Crossbow Knight kited, so
   bolt-RNG not skill decided runs. Fixed the closing physics and ranged AI (no point-blank
   bolts, no kiting when pinned) and steepened the late curve. `npm run selfplay` is now
   monotonic — **novice 20.8 < decent 26.7 < expert 30.3**, zero timeouts, no wall.

## Known notes
- The PWA service worker (autoUpdate) serves cached assets; returning players auto-update on
  next load. First-time and hard-reloaded loads always get the latest build.
- `npx cap add ios` is wired but not executed here (needs Xcode/CocoaPods on the machine).
