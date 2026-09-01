# KNIGHTFIGHT - ROUND 2 (from Franz, 2026-09-01)

Knightfight is live and working. Franz played it and wants these changes. Execute all of them
end to end, autonomously, no questions. Gates green, redeploy, re-verify with fresh screenshots.

**Priority order: 1 first, then 2, 3, 5, and 4 running alongside.**

---

## 1. GRAPHICS: CALMER AND PROPERLY PIXELATED (do this first)

Right now it renders as smooth vector shapes with soft glows. Franz wants **real pixel art**
and a **calmer** image.

**True pixel rendering:**
- Render the whole scene into a **low-resolution offscreen buffer** (pick a fixed retro grid,
  e.g. ~180x390 logical pixels for portrait) and then **integer-upscale** it to the canvas with
  `ctx.imageSmoothingEnabled = false`. One consistent chunky pixel size across the entire frame -
  knights, background, FX, everything.
- **Snap every draw to the pixel grid.** No sub-pixel positions, no anti-aliased diagonal edges.
  Rotations must quantise to the grid so a swinging sword reads as stepped pixels, not a smooth arc.
- Do NOT keep a smooth renderer and fake it with a CSS filter. It has to be a real low-res buffer.

**Calmer:**
- Cut contrast and saturation. Fewer competing bright things on screen at once.
- Fewer particles, slower ember drift, less flicker. The scene should feel still and moody,
  not busy. Motion should come from the fighters, not from background noise.
- Dial the CRT scanlines and chromatic aberration right down - subtle, or off by default.
- Keep the fighters clearly readable against the background. Calm must not mean muddy.

**Lighting must be pixelated too:**
- Replace the smooth radial gradients on the torches and the moon with **quantised light bands** -
  3 or 4 discrete steps of falloff, hard-edged on the pixel grid. Classic retro banded light.
- Same for the rim light on the knights: stepped, not smoothly interpolated.
- No soft blurry glows anywhere.

## 2. HANDS AND ARMS MUST LOOK NATURAL

Currently the arms stick straight out sideways and the sword floats near the hand.

- The **hand actually grips the hilt** - the hand position is derived from the weapon grip point,
  not drawn near it. Two-handed poses put the off-hand on the pommel.
- **Correct elbow IK**: elbows bend the anatomically right way with a proper pole vector, shoulders
  stay anchored to the torso, no hyperextension, no arm clipping through the body or head.
- **Real guard stance at idle**: blade raised in a believable guard, weight on the back foot -
  not both arms horizontal.
- **Wrist follows the blade angle** through the whole swing arc.
- The **off-hand always has a job**: on the hip, gripping a shield, bracing the pommel, or
  counter-balancing the swing. Never dangling.
- Check every archetype pose, not just the player.

## 3. TAP DIRECTION MUST ACTUALLY MATTER

A tap up, down, left or right has to be a genuinely different attack, and the player must be able
to feel and see the difference.

- Split the screen into **tap zones - up / down / left / right** (centre if you need it), each
  producing its own attack with its own damage, reach, wind-up, recovery and animation:
  - **up** = high cut at the head
  - **down** = low cut at the legs
  - **left / right** = strike into that side's opening
- The enemy holds a **guard direction** that changes during the fight. Striking into the guarded
  direction gets blocked or chipped for very little; striking the **open** direction does full
  damage and real guard damage. This is the core read of the whole game.
- **Show the guard direction readably** in pixel art - a guard indicator the player can parse in
  a fraction of a second. No text.
- Feed the directions into the combo system as distinct tokens, and update the Combo Codex.
- Update `docs/` and the title-screen hint text so the player learns this.

## 4. BRING IN EXPERTS AND TESTERS (run these alongside the work)

Dispatch **subagents** - asking agents is encouraged, asking a human is not:
- a **UX/UI designer agent**: audit and redesign the interface - title, boon pick, codex,
  Hall of Valor, death screen, in-fight HUD. Clear hierarchy, thumb-reachable, unmistakable
  affordances, nothing accidental, minimum 16px type everywhere.
- a **retro game feel / fun agent**: judge it as a retro arcade game. Is it fun in the first
  10 seconds? Is the moment-to-moment feedback satisfying? Where is it boring, unfair or unclear?
- several **user-test agents**: have them actually PLAY the deployed game through browser
  automation with synthetic gestures - a first-timer, an impatient player, a min-maxer - and
  report concrete friction, confusion and misfires.

Collect their findings, decide what is worth doing, implement the top ones, and write the whole
round up in `docs/PLAYTEST.md` (who reported what, what you changed, what you rejected and why).

## 5. BOONS: SWIPE LEFT TO TAKE, NEVER TAP

Franz is picking boons **by accident** because a tap commits instantly.

- **A tap must never commit a boon.** Tap only focuses a card and shows its detail.
- **Swipe LEFT on a card takes it.** Nothing else takes it.
- Make it obvious and satisfying: a visible "swipe left to take" affordance on the focused card,
  the card follows your finger as you drag, and it snaps back if you release too early.
- Apply the same anti-misfire rule to every other committing choice - spending valor, abandoning
  a run, anything destructive. Committing needs a deliberate gesture, never a stray tap.

---

## DONE MEANS
- All gates green: `npm run typecheck && npm run lint && npm run test && npm run build`, plus
  `npm run selfplay` still monotonic (novice < decent < expert, no wall) after the combat changes.
- Redeployed to https://knightfight.franzai.com and verified live.
- **When verifying, unregister the service worker first** or you will screenshot the OLD build:
  `for(const r of await navigator.serviceWorker.getRegistrations())await r.unregister();`
  `for(const k of await caches.keys())await caches.delete(k);` then reload. Also cross-check the
  bundle filename in the live HTML against `dist/assets/`.
- Fresh screenshots at 390x844 proving: the pixelated calm look, banded lighting, natural grip and
  guard stance, a directional strike landing on an open guard, and the swipe-left boon pick.
- Committed and pushed. `docs/PLAYTEST.md` written.
- No half-done items, no TODOs, no "one caveat" ending.
