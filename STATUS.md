# Knightfight — final status

**Live:** https://knightfight.franzai.com · **Repo:** https://github.com/Arthur-Ficial/knightfight
**Build:** ~72 KB JS (25.7 KB gzip), loads in ~0.2s, works offline after first load (PWA).

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
