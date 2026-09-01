# Knightfight

A retro-premium, **gesture-only**, endless knight-duelling game. Portrait, one hand,
no buttons — the whole screen is your blade. Built in strict TypeScript with a pure,
deterministic, testable simulation and a zero-asset procedural renderer + audio.

**Play:** https://knightfight.franzai.com

## How to play

There are **no on-screen buttons**. Everything is a gesture.

| Gesture | Action |
|---|---|
| Tap | Light strike (tap the enemy's open side to hit where his guard is not) |
| Double tap | Feint → jab (bait the parry, then punish) |
| Hold (press & hold) | Charge a heavy — 3 tiers, longer = more damage + guard break, but you are wide open |
| Swipe left / right | Sidestep dodge (i-frames) |
| Swipe up | Overhead cut (breaks low guard) |
| Swipe down | Low sweep / shield bash (staggers, opens guard) |
| Swipe diagonal | Directional slash |
| Two-finger tap | **Parry** (earned) — perfect window opens a riposte |
| Two-finger hold | Block (drains stamina, chip damage) |
| Circle / swirl | Whirlwind special (earned, costs full rage) |
| Pinch | Focus — brief slow-mo (earned) |

Read the enemy's **tell**: a wind-up pose and a shrinking ring coloured
**white** (blockable), **gold** (parryable) or **red** (unblockable — you must dodge).

Chain gestures inside the rhythm window to discover **named combos** (see the Combo Codex).
Kill an enemy → pick 1 of 3 **boons** → a new, harder enemy walks in. Death earns **Valor**
for the permanent upgrade tree — where you unlock the parry, whirlwind and focus gestures.
The moveset itself is progression.

## Architecture

```
src/
  config/   all tunables (damage, timings, palette, enemies, boons, combos, meta) — SSOT
  core/     branded types, seeded RNG, fixed-step loop, event bus, ring-buffer log
  sim/      pure deterministic combat — no DOM. Same seed + intents = same fight
  input/    PointerEvent → gesture recognizer → Intent[]  (the sim only sees Intents)
  render/   canvas2d (procedural skeletal animation, FX, post) + headless (tests)
  audio/    100% procedural WebAudio — synths, sfx, dark chiptune score
  platform/ storage / haptics / viewport — the iOS (Capacitor) swap seam
  ui/       DOM overlays for menus (never shown during a fight)
  app/      the game shell / state machine
```

## Develop

```bash
npm install
npm run dev         # vite dev server
npm run typecheck && npm run lint && npm run test && npm run build   # hard gate
npm run selfplay    # headless balance report → docs/BALANCE.md
```

## iOS (Capacitor-ready)

`base: './'`, everything bundled, no network calls, works offline. `capacitor.config.ts`
is in place (`appId com.franzai.knightfight`, `webDir dist`). To wrap natively:

```bash
npm run build && npx cap add ios && npm run ios:sync
```

## Debugging

`window.__KF_LOG.tail(20)` in the console dumps the sim event ring-buffer. Long-press the
title logo for the dev overlay. See `docs/EASTER-EGGS.md` and `docs/BALANCE.md`.
