# KNIGHTFIGHT - ROUND 2, ADDENDUM (Franz, 2026-09-01, minutes after ROUND2.md)

Franz sent these straight after ROUND2.md. They are part of the SAME round - do them together
with ROUND2.md, not afterwards. Same rules: fully autonomous, no questions, gates green, redeploy,
verify live.

---

## A. THE ENEMY'S ATTACK MUST BE DIRECTIONAL AND READABLE TOO

ROUND2 item 3 made OUR taps directional. Franz wants the mirror image of that for incoming attacks.

- When the enemy attacks, the player must instantly see **which direction it comes from** -
  high / low / from his left / from his right.
- Use the **exact same pixel-art visual language** for "I strike here" and "he strikes here", so
  one symbol set teaches both halves of the fight. Direction is shown on the enemy during the
  wind-up, not after the hit lands.
- The player answers with a **matching directional defence**: dodge, parry or block in the correct
  direction. Right direction = clean defence and a riposte opening. Wrong direction = you eat it.
- Combined with the tell colours (white blockable / gold parryable / red must-dodge) this becomes
  the whole read: **which colour** tells you what to do, **which direction** tells you where.
- Attack and defence directions must both flow into the combo system and the Codex.

## B. ZERO SCROLLING. EVERYTHING ABOVE THE FOLD.

**Nothing in this app may ever scroll.** Today the Combo Codex and the Hall of Valor are long
scrolling lists - that has to go, and the interface has to be redesigned around the constraint.

- No scrollable panel, no scroll container, no overflow anywhere: title, Combo Codex, Hall of
  Valor, boon pick, death screen, in-fight HUD.
- Redesign those screens to fit one screen: compact grids, pages with a clear pager, tiers,
  or symbol rows. If it does not fit, cut it down or paginate it - never scroll it.
- Must fit with safe-area insets on **both 390x844 and the small 375x667 phone**. Check both.
- Prove it with automation on the live site, on every screen:
  `document.documentElement.scrollHeight <= window.innerHeight` and no element with a computed
  `overflow` of `auto`/`scroll` and a scrollHeight larger than its clientHeight.

## C. CUT THE TEXT, HARD. SYMBOLS FIRST.

**"Even a barely-literate user must understand the game."** Right now selection screens are
sentences. Franz wants that gone, most of all on anything you SELECT.

- **Boon cards**: an icon, a very short name, and one compact stat line like `+40% ⚔` or `-20% ⚡`.
  No sentences, no descriptions. Rarity by colour and frame, not by the word "[rare]".
- **Hall of Valor**: icon per upgrade, cost as a number, rank as pips (●●○○). Not prose.
- **Combo Codex**: show the combo as a **row of gesture pictograms**, not words. An undiscovered
  entry is silhouetted pictograms, not "??? - undiscovered, 3 inputs".
- **Title screen**: replace the instruction paragraph with **animated gesture pictograms** - a
  ghost hand tapping, holding, swiping. Show the gesture, do not describe it.
- Add a **wordless first-run tutorial**: the ghost hand demonstrates the gesture the player needs
  right now, in the fight, and disappears once they do it.
- Everything that survives stays at **minimum 16px**. Less text, not smaller text.
- Rule of thumb: if a screen needs a sentence to be understood, the design is wrong - redraw it.

## D. THE ARMS STILL LOOK AWKWARD - FIX THEM PROPERLY

Franz looked again and calls out the **arms** specifically. Treat ROUND2 item 2 as the priority
inside this round, and go further:

- Fix the **shoulder attachment** - the upper arm must socket into the torso, not float beside it.
- Fix **upper-arm to forearm proportions**; the elbow sits at a believable place along the arm.
- **Elbow bends the right way** in every single pose: idle guard, wind-up, strike, recovery,
  block, parry, stagger, death. Check each one, for the player and for every archetype.
- The **hand grips the hilt** exactly - derive the hand from the weapon's grip point.
- Shoulders and arms must move **with** the body: weight shift, torso rotation, follow-through.
  An arm that swings while the torso stays frozen is what makes it look wrong.
- Screenshot each pose and actually look at it before calling this done.

---

## VERIFY, THEN REPORT
Gates green, selfplay still monotonic, redeployed, service worker unregistered before you
screenshot, fresh screenshots at **both** 390x844 and 375x667 proving: no scrolling anywhere,
symbol-first selection screens, readable incoming attack directions, and natural arms in several
poses. Push, update the docs, write `docs/PLAYTEST.md`. No caveats ending.
