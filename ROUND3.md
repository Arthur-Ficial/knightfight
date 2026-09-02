# KNIGHTFIGHT - ROUND 3 (Franz, 2026-09-02)

Franz's words, verbatim:

> "when i tab from below the animation must also move the arm and attack from below.
>  forward when [from the front], when for top attack from above, when behind me go back .....
>  and the enemies can also attack the same way!!!!!!"

One theme, no side quests: **the attack DIRECTION must be visible in the SKELETON, not only
in the game logic and not only in an indicator glyph.** Right now up/down/left/right taps
differ mechanically but the arm swing looks broadly the same. That is the bug. Fix it for the
player AND for every enemy.

---

## A. Directional attack animations - PLAYER

Every directional input drives its own arm/weapon arc. Four distinct, instantly readable motions.
They must be built from the existing procedural skeleton/IK (no sprite sheets), and they must
read at pixel resolution from a 3-frame glance.

| Input | Motion that MUST be visible |
|---|---|
| **UP** (tap/swipe up) | **Rising attack from BELOW.** Arm starts low, weapon tip below hip/behind the knee, sweeps up through the body line, ends high. An uppercut / rising slash. Shoulder rotates from -deep to +high, elbow uncoils on the way up, torso extends upward, weight shifts onto the front foot, back heel lifts. |
| **DOWN** (tap/swipe down) | **Overhead attack from ABOVE.** Arm raises fully over the head first (visible wind-up frame, weapon vertical or tipped back past the helm), then chops down hard on the vertical. Torso pitches forward at the waist on the strike, knees bend on impact. |
| **FORWARD** (toward the enemy - the horizontal direction facing the enemy) | **Thrust / lunge straight forward.** Arm retracts to the ribs, then extends fully along the horizontal, weapon tip travels forward, body lunges: front leg extends, back leg trails straight, whole knight translates toward the enemy and recovers. |
| **BACK** (away from the enemy) | **Wind up backwards / go back.** Knight steps back, torso rotates away, arm cocks behind the shoulder (weapon behind the back / over the far shoulder), then releases as a wide backhand return sweep across the body. The retreat is part of the animation, not just a dodge. |

Requirements:
- **Different keyframe paths, not the same arc rotated by a constant.** Elbow, shoulder, wrist,
  spine, hips and both feet must each carry a per-direction curve. If you can implement all four
  by feeding one number into one existing function, you have not done this.
- **Weapon tip trail** (the existing swoosh/FX) must follow the actual per-direction path, so the
  arc drawn in the air is up-arc / down-chop / straight line / behind-the-back loop.
- **Wind-up is where the direction is told.** The anticipation frames must already differ, before
  the strike lands, so a player reads the direction early. That is what makes the fight fair.
- Keep the hands/arms natural (round 2 note): no snapped elbows, no arms passing through the torso,
  shoulder stays attached, no hyperextension past human range.
- No text labels for this. The pose IS the message.

## B. The enemies attack the SAME WAY

"and the enemies can also attack the same way!!!!!!"

- Every enemy archetype uses the **same four directional attack animations**, mirrored to their facing.
- Which direction an enemy attacks from must be **chosen by the sim** (per archetype tendency +
  RNG), driven through the SAME animation code as the player. One shared implementation - DRY.
  A single source of truth for "direction -> pose", used by player and enemy alike.
- The enemy's directional wind-up is the telegraph: seeing the arm cock behind the shoulder or
  raise overhead must tell you what is coming, and it must line up exactly with the existing
  direction indicator/chevron. **Pose and indicator must never disagree.** Add a test that asserts
  the telegraphed direction and the resolved attack direction are the same value.
- The correct defensive answer must stay coherent: the counter for an overhead is not the counter
  for a thrust. If the existing defense mapping does not already match the four directions, make it
  match, and document it in docs/BALANCE.md.
- Archetype flavour: give archetypes different directional tendencies (a big slow one favours the
  overhead, a spear/ranged one favours the thrust, a fast one favours the rising cut). Pure config
  in src/config/enemies.ts - no per-enemy animation code.

## C. Non-negotiables carried over

- Zero scrolling, everything above the fold, at 375x667 AND 390x844.
- Text stays brutally minimal. Do not solve any of this with a word.
- Calm, pixelified, banded lighting. Integer upscale, imageSmoothingEnabled=false.
- Gates all green before deploy: `npm run typecheck && npm run lint && npm run test && npm run build`.
- Selfplay balance must stay monotonic across tiers - re-run it, paste the numbers.
- Determinism test must still pass.

## D. Prove it - no self-reporting without artefacts

1. Deploy to knightfight.franzai.com, confirm the live bundle hash equals dist/.
2. **Screenshot every one of the 8 animations at its wind-up peak AND its strike peak**
   (player up/down/forward/back, enemy up/down/forward/back), Read every screenshot yourself,
   and only accept it if you can name the direction from the picture alone.
3. Drive real pointer gestures against the deployed build and pull `window.__KF_LOG.tail()` to
   show input direction -> animation clip -> resolved hit direction all agree.
4. Console must be error-free. scrollY must be 0.
5. Commit + push. Update docs/BALANCE.md and README with the direction table.

Then `say "Franz, Knightfight round 3 directional attacks are live"`.
