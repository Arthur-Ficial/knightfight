# Knightfight - Round 2 playtest

Five agents reviewed the build: a **UX/UI designer**, a **retro game-feel** critic, and
three **user-testers** (first-timer, impatient masher, min-maxer). Methodology: each played
the game by reading the real source and reasoning as its persona (a shared browser was in use
by the live-verification harness, so automated play would have collided; the sim/UI code is
the ground truth for behaviour). Findings, what changed, and what was rejected below.

## Fixed (highest-impact first)

1. **BUG - the tutorial taught the wrong dodge.** *First-timer.* The wordless tutorial showed a
   fixed "⇦ swipe left" and completed on any swipe, but the engine only counts a dodge that
   MATCHES the incoming attack's direction - so the first defensive move it taught was the one
   that gets you hit. Now `Tutorial.onTelegraph(dir)` shows the glyph for the live
   `enemy.move.dir` and only completes on a matching dodge (`src/app/tutorial.ts`).
2. **BUG - the riposte window was never consumed.** *Min-maxer.* A parry armed a 700ms window and
   EVERY strike inside it got the 3.2x riposte mult, stacking with execution (1.4x) and a
   mis-applied open-bonus (1.15x) ~ 5x base, plus uncapped lifesteal = unlosable. Now the window
   is consumed on the first connecting riposte (one parry = one punish), `RIPOSTE_DAMAGE_MULT`
   3.2->2.2, `EXECUTION_MULT` 1.4->1.35, `GUARDED_DAMAGE` 0.4->0.25 (the direction read matters
   more), the open-bonus applies only to true open-direction strikes, and lifesteal is capped
   per hit (`src/config/combat.ts`, `src/sim/resolve-player.ts`). Selfplay stays monotonic.
3. **Slow-mo and haptics were dead code.** *Retro-fun.* `duel.slowmo` was decremented but never
   slowed anything and `vibrate()` had no call site. Now the shell steps the sim at
   `SLOWMO.factor` rate while slow-mo is active (kills/parries/Focus finally land) and every
   meaningful hit fires a haptic pulse (`src/app/game.ts`, `src/app/feel.ts`).
4. **Parry was locked from new players.** *Retro-fun.* The core directional-defence read needs
   parry, so it is now unlocked by default; the meta node became "widen the window"
   (`src/sim/meta.ts`, `src/config/meta.ts`).
5. **Silent inputs felt broken while mashing.** *Impatient.* Taps dropped during recovery gave no
   feedback. A `busy` cue now puffs at the player so a dropped tap reads as "still swinging,"
   not "the game ignored me" (`src/sim/player-actions.ts`, renderer).
6. **The guard chevron was near-invisible and looked like the attack chevron.** *First-timer.*
   The guard mark is now a bright shield-bracket on a dark backing, visually distinct from the
   bold filled attack arrow (`src/render/canvas2d/indicators.ts`).
7. **Silent damage sources.** *Retro-fun.* Poison, hound bites and guarded "clang" hits now emit
   events with sound so you know why you took damage.
8. **UX polish** (UX/UI designer): curses are marked by colour + frame not the word "[rare]";
   primary CTAs are bottom-anchored in the thumb zone; menus have a visible Back and never
   scroll; the title paragraph became animated ghost-hand pictograms; the death-screen revive
   instruction now matches the actual gesture.

## Rejected (with reasons)

- **"Let a tap commit an already-focused boon" / lower the swipe threshold hard.** *Impatient.*
  Rejected - a tap committing a boon is the exact accidental-pick Franz asked us to remove.
  Swipe-left-only stays; the affordance and card-follows-finger drag make it discoverable.
- **Remove double-tap -> feint so mashers get two strikes.** *Impatient.* Kept - feint is an
  intentional gesture and only triggers on two fast taps in the SAME spot; the `busy` feedback
  addresses the underlying "unresponsive" feeling without deleting a move.
- **Require the parry to be directional too.** *Min-maxer.* Deferred - the single-use riposte +
  multiplier cuts already de-fang the parry loop, and parry is now the new player's core defence;
  making it directional as well risks over-punishing beginners. Flagged for future tuning.
- **Hide the charge/parry tiles on the title until unlocked.** *First-timer.* Partly moot now that
  parry is unlocked by default; charge is available from the start too. Only circle/pinch remain
  earned and they are not shown on the title.

## Not yet done (honest backlog)
- A persistent in-fight legend for the white/gold/red tell colours (the wordless tutorial teaches
  the dodge; the colour meaning is still learned by doing). Candidate for a future round.
