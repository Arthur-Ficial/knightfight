# Knightfight — playtest

Two rounds of review. **Round A** (design/UX experts + persona analysis of the source).
**Round B** — the important one — three user-tester agents that **actually played the
deployed build** through browser automation with synthetic pointer gestures, each in its own
isolated `AGENT_BROWSER_SESSION` (this is how we escaped the shared-browser collision that
blocked real play the first time). Findings below are from real play: `window.__KF_LOG` values
and screenshots, not speculation.

## Round B — real play of the live build

### First-timer (played rung 1→2, actually won and died)
- **Confirmed working:** the boon anti-misfire is exactly right — a **tap only expands the
  card's detail and commits nothing; a swipe-left takes it** and advanced rung 1→2. Directional
  dodge fires and spends stamina as intended.
- **Fixed - tutorial didn't protect the newcomer:** they lost ~90% HP on rung 1 before working
  out that tapping strikes. The first-run tutorial now **freezes the enemy's offense during the
  tap lesson** and only lets it telegraph gently during the dodge lesson, so you learn safely.
- **Fixed - dodge timing unlearnable:** early telegraphs were too fast to react to. Rungs 1-2 now
  telegraph ~45% slower.
- **Fixed - death taught nothing:** an unblocked hit now flashes a fading red chevron showing the
  dodge you should have made.
- **Fixed - guard read illegible:** a guarded-direction strike now shows **BLOCKED** and a guard
  break shows **BREAK!**, so hitting the open vs guarded side reads instantly.
- **Composition (Franz's note + tester):** first pass over-corrected (fighters sank low). Final:
  bigger fighters with the pair centred (~mid-screen), balanced headroom and foreground.

### Impatient masher (mashed taps, rushed menus, rage-tested)
- **Fixed/mitigated - silent dropped inputs:** a tap dropped mid-swing now puffs a `busy` cue so
  the input reads as received. (The core "spam loses to timing" rule stays by design - mashing
  the same spot into a raised guard *should* fail; the cues now teach why instead of feeling
  dead.)
- **Fixed - "why am I dying":** the missed-dodge chevron + BLOCKED cue above address the
  invisible-punishment complaint; the punish is now legible.
- **Rejected - "let a tap take the boon / add a tap-to-revive button":** a tap committing a boon
  is the exact accidental pick Franz asked us to remove. Swipe-left-to-commit stays. The pace
  hit between fights is the price of never mis-picking, and the affordance makes it obvious.

### Min-maxer (probing the parry/riposte economy and boon stacks)
- Verifying the Round-A balance fixes hold in live play (riposte window now single-use, lifesteal
  capped, open-bonus only on true open hits). Findings folded in below once the run completes.

## Round A — expert + source-persona review (already applied)
- Fixed the tutorial teaching a fixed "swipe left" while the engine needs the **matching** dodge
  direction (now shows the live attack direction).
- Fixed the never-consumed **riposte window** exploit (one parry = one punish; lower
  riposte/execution/guarded multipliers; capped lifesteal; open-bonus only on true open strikes).
- Made **slow-mo** and **haptics** actually fire (both were dead code); **parry unlocked** by
  default (it's the core defensive read); poison/hound/clang now make sound.
- UX: curses marked by colour+frame; bottom-anchored CTAs; no-scroll menus with a visible Back;
  title = animated ghost-hand pictograms; corrected the revive instruction.

## Rejected / deferred (with reasons)
- **Tap-to-commit boons / valor** — rejected; reintroduces the accidental-pick misfire. Swipe only.
- **Remove double-tap→feint** — kept; it only triggers on two fast taps in the same spot and the
  `busy`/timing cues address the underlying "unresponsive" feeling.
- **Directional parry (as well as directional dodge)** — deferred; the single-use riposte + the
  multiplier cuts already de-fang the parry loop, and parry is the new player's core defence.

## Method note
Real play used isolated sessions (`AGENT_BROWSER_SESSION=tester1|2|3`). On this machine the
sessions share one browser profile, so testers ran **sequentially**, not concurrently — but each
genuinely drove the deployed game (taps/swipes on `#kf-canvas`, pointer drags on the `#kf-ui`
DOM cards) and reported from observed `__KF_LOG` state and screenshots.
