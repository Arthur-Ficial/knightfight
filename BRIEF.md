# KNIGHTFIGHT - BUILD BRIEF
**From:** Franz (via Claude Code on Franz's Mac) · **Date:** 2026-09-01
**To:** Claude Code on Arthur Mac (`claude --dangerously-skip-permissions`)
**Working dir:** `/Users/arthurficial/dev/knightfight`

## 0. THE ORDER

Build **Knightfight**: a retro-themed, gesture-only, endless knight-duelling game.
Ship it live at **https://knightfight.franzai.com** (Cloudflare Pages), architected so it can be
packed as a native **iOS app** later without a rewrite.

**Execute this end to end. Do not ask questions. Do not stop half way. Do not hand work back.**
Research anything you do not know (web, docs, repo, git history). Asking a human is failure.
If you hit a genuine hard blocker, note it in `STATUS.md` and keep building everything else.

Golden Goal: Franz opens knightfight.franzai.com on his iPhone, plays one-handed with only
taps/swipes/holds, and it feels like a real, juicy, premium fighting game - not a web toy.

---

## 1. GAME DESIGN

### 1.1 Core loop
Endless ladder of 1v1 duels. Portrait, one hand, no menus during a fight.
Kill an enemy -> a new, harder enemy type walks in. Never ends. Death -> meta-progression -> new run.

```
title -> duel -> victory -> boon pick (1 of 3) -> next duel (new enemy) -> ... -> death -> meta upgrades -> title
```

### 1.2 INPUT: GESTURES ONLY - THIS IS THE HEART OF THE GAME
**There are NO fight buttons. No d-pad. No virtual stick. No on-screen action UI at all.**
Everything is tap, swipe, hold, multi-touch, rhythm and timing. The whole screen is the controller.

| Gesture | Action | Notes |
|---|---|---|
| Tap | Light strike | fast, low damage, low stamina, chains |
| Tap on enemy's open side (left/right half) | Directional light strike | hits where his guard is NOT |
| Double tap | Feint -> jab | baits the enemy parry, then punishes |
| Hold (press & hold) | Charge heavy | 3 charge tiers, ring fills; release = swing. Long charge = big damage + guard break, but you are wide open |
| Swipe left / right | Sidestep dodge | i-frames ~120ms, costs stamina |
| Swipe up | Overhead cut | slow, breaks low guard |
| Swipe down | Low sweep / shield bash | staggers, opens guard |
| Swipe diagonal (4 dirs) | Directional slash | must hit the direction his guard is open |
| Two-finger tap | **Parry** | perfect window ~160ms around impact -> riposte window |
| Two-finger hold | Block | drains stamina, chip damage, breaks if overwhelmed |
| Circle / swirl gesture | Whirlwind special (unlocked) | costs full rage meter |
| Pinch in | Focus - brief slow-mo (unlocked relic) | limited charges |
| Rapid alternating taps L/R | Flurry | rhythm-scored, misses break the chain |

**Timing layer (the skill ceiling):**
- Every enemy attack telegraphs with a readable **tell** (wind-up pose + a shrinking ring + a
  colour: white = blockable, gold = parryable, **red = unblockable, must dodge**).
- Perfect parry (inside the window) -> hit-stop, sparks, enemy staggered, **riposte window** open.
- Riposte inside window -> massive damage + cinematic hit-stop.
- Attacking during your own recovery frames = punished. Spam must lose to timing.
- Enemies feint: a tell that cancels. Feint-punish is a learnable read.

**Combo layer:**
Gesture sequences inside a rhythm window (~450ms between inputs) chain into named combos with
escalating multipliers. Combos are **discovered**, then recorded in a **Combo Codex** the player
unlocks entry by entry. At minimum 12 named combos, e.g.:
- `tap, tap, swipe-up` -> **Rising Lion** (launcher)
- `swipe-down, hold-release` -> **Earthbreaker** (guard break + stagger)
- `parry, tap, tap, swipe-diag` -> **Riposte Royale** (highest dps in the game)
- `swipe-L, swipe-R, tap` -> **Dancer's Cut** (dodge-cancel into strike)
- `double-tap, hold-release` -> **Feintbreaker**
- `circle, tap` -> **Whirlwind Finish**
Design 12+ of these properly, with real risk/reward, not filler.

### 1.3 Combat model (deterministic, testable)
- Fixed timestep sim @60Hz, seeded RNG (mulberry32), pure functions, zero DOM.
- Player state: HP, **stamina** (yellow, gates every action, regens when idle),
  **rage/momentum** (fills on hits and perfect parries, spends on specials),
  poise, i-frames, recovery frames, active combo chain.
- Enemy state: HP, **guard meter** (break it -> execution window), attack pattern FSM,
  aggression/feint/tempo parameters that scale with the ladder rung.
- Damage: base x combo multiplier x charge tier x crit x relic modifiers. No magic numbers -
  every value lives in `src/config/`.
- **Hit-stop** on every meaningful connect (3-9 frames), screenshake scaled to impact,
  slow-mo on kills and perfect parries. Juice is not optional, it IS the game feel.

### 1.4 Enemy ladder - new enemy appears when the previous one is beaten
Introduce a **new archetype each rung**, then recycle with affixes. At least 14 archetypes:
1. **Squire** - tutorial fodder, slow, one attack, teaches tap
2. **Bandit** - fast tap-punish, teaches dodge
3. **Man-at-Arms** - blockable combos, teaches block/stamina
4. **Shieldman** - must guard-break, teaches heavy charge
5. **Twin Daggers** - flurries, teaches parry rhythm
6. **Halberdier** - long reach, red unblockables, teaches spacing/dodge
7. **Crossbow Knight** - ranged volleys, must close distance between shots
8. **Flagellant** - gets faster as he loses HP
9. **Houndmaster** - two targets, adds
10. **Black Knight** - mirror-match, parries YOUR attacks, punishes spam
11. **Kingsguard** - feint-heavy, reads your last combo and adapts
12. **Plague Knight** - poison DoT, forces aggression
13. **Champion** (boss, rung 13) - multi-phase, phase change on 50% HP
14. **Dread Knight** (endless boss, every 10 rungs after) - all mechanics combined
After rung 14: recycle archetypes with **affixes** (Swift, Ironclad, Vengeful, Twinned, Cursed,
Bloodthirsty, Unyielding...) and rising stat curves. Truly endless, curve stays fair.

Difficulty curve knobs that scale per rung: telegraph length shrinks, attack speed rises,
feint probability rises, combo length grows, punish severity rises. Tune so rung 1-3 is easy
for anyone, rung 10 needs real skill, rung 20+ is expert.

### 1.5 Progression
**In-run (roguelite):** after each victory pick 1 of 3 boons - relics ("Widow's Ring: +40% riposte
damage"), weapon runes, blessings, cursed boons (big power, real drawback). 30+ boons, real synergies.
**Meta (persistent):** Valor earned per run -> permanent tree: max stamina, parry window ms,
crit chance, extra dodge charge, **unlock new gestures** (circle whirlwind, pinch focus, two-finger
parry starts locked and is EARNED - the moveset itself is progression).
**Ranks/titles** by best rung. Local best-run board. All persisted via a storage abstraction.

### 1.6 Easter eggs (make them real, hide them well)
- Title-screen gesture code (swipe up, up, down, down, left, right, left, right, double-tap)
  -> unlocks **Chicken Knight** skin + rubber-chicken weapon (real weapon stats, comedy sfx).
- Tap the moon in the background 10x -> permanent **Blood Moon** night mode + a werewolf enemy.
- 7 perfect parries in a row in one duel -> secret relic **"The Metronome"**.
- Idle 60s on the title -> the knight sits down and sharpens his sword; idle 3min -> he falls asleep.
- Reach rung 33 -> a mysterious hooded duelist appears out of ladder order.
- Long-press the game logo 5s -> dev overlay with sim stats (also useful to you for debugging).
- Draw a heart gesture in the death screen -> +1 revive next run, once per day.
Write them all down in `docs/EASTER-EGGS.md` (Franz must be able to find his own eggs).

### 1.7 Look & feel - "super cool graphics"
Retro, but **premium retro** - not programmer-art pixels.
- **Style:** dark torch-lit arena, high-contrast **silhouette + rim-light** knights, limited retro
  palette (~32 colours), chunky pixel-consistent rendering with integer scaling.
- **Animation:** procedural skeletal animation (torso/head/arms/legs/weapon segments, IK, weight,
  anticipation and follow-through) - NOT frame-by-frame sprite sheets. Gives fluid, weighty, cheap,
  code-only animation that looks expensive. Cape/cloth sim on the cape. Weapon trails.
- **FX:** sparks on parry, blood decals that persist on the arena floor, dust puffs on dodges,
  torch flicker lighting the fighters, dynamic shadows, embers drifting, parallax background layers
  (castle wall / crowd silhouettes / banners), rain in some arenas.
- **Post:** subtle CRT scanlines + vignette + chromatic aberration + bloom on sparks. Toggleable.
- **Audio: 100% procedural WebAudio** - no asset files. Synthesised sword clangs, parry rings,
  impacts, grunts, crowd swells, plus a dark medieval chiptune score that intensifies with the rung.
  Audio context unlocked on first touch (iOS policy). Mute toggle persisted.
- **Zero external assets.** Everything code-generated or inlined. This keeps the iOS bundle clean
  and there is nothing to license.

---

## 2. TECH + ARCHITECTURE (non-negotiable)

- **TypeScript strict**, Vite, **zero heavy runtime deps** (no React, no game engine, no physics lib).
- **`base: './'` in vite config** - relative paths, mandatory for the later iOS bundle.
- Hard separation, renderer swappable:
```
src/
  config/      # all tunables: units, damage, timings, palette, waves, boons  (SINGLE SOURCE OF TRUTH)
  core/        # types (branded ids), rng, fixed-step loop, event bus
  sim/         # PURE game logic. NO DOM. combat, stamina, guard, combos, ladder, boons, ai
  input/       # PointerEvent -> gesture recognizer -> Intent[]  (sim only ever sees Intents)
  render/
    canvas2d/  # the shipping renderer: skeleton drawing, fx, post, hud
    headless/  # no-op renderer for tests + selfplay
  audio/       # procedural WebAudio synths
  platform/    # storage / haptics / fullscreen / safe-area  <- the iOS swap seam
  ui/          # title, codex, boon pick, death screen (DOM overlay, min 16px text)
  main.ts
```
- **Files: target <=200 lines, hard max 250.** Functions <=30 lines, <=4 params.
- Named exports only. Explicit return types. **No `any`. No fallbacks. No mock data outside tests.
  No TODO comments. No commented-out code. No god objects. No boolean params.** DRY, SSOT, fail fast + loud.
- Deterministic: same seed + same intent log = same fight. This gives you replays AND real tests.
- **Client-side logging an AI can read**: a debug ring-buffer exposed as `window.__KF_LOG` plus a
  dev overlay (see easter egg 6), so you can read game state from the browser console when testing.

### 2.1 Testing - vitest, NO MOCKS
Real sim, real recognizer, real data. Cover at minimum:
- gesture recognizer against synthetic pointer traces (tap vs hold vs swipe vs 2-finger, thresholds,
  noise, fat fingers, diagonal ambiguity)
- damage/stamina/guard math, i-frames, recovery windows
- parry window boundaries (just-in / just-out, off-by-one at 60Hz)
- combo detection incl. rhythm-window expiry and false positives
- ladder progression + affix scaling + boon stacking
- RNG determinism and save/restore
**`npm run selfplay`**: a headless bot that plays N rungs against the real sim and prints a balance
report (avg rung reached per skill level, dps, death causes, stamina starvation, unwinnable checks).
Use it to actually TUNE the game. Ship the report in `docs/BALANCE.md`.

### 2.2 iOS-packaging readiness (build it in NOW, do not retrofit)
- **Capacitor-ready**: add `capacitor.config.ts`, appId **`com.franzai.knightfight`**, appName
  `Knightfight`, webDir `dist`. Add `npm run ios:add` / `ios:sync` scripts. You do NOT have to
  produce an Xcode build today, but `npx cap add ios` must work with no code changes.
- Everything bundled locally, relative paths, no runtime network calls, works fully offline.
- `platform/` abstracts storage (localStorage now -> Capacitor Preferences later), haptics
  (`navigator.vibrate` now -> Haptics plugin later), safe-area, fullscreen.
- CSS: `100dvh` + JS viewport lock (no iOS 100vh bug), `env(safe-area-inset-*)` padding,
  `touch-action: none`, `-webkit-user-select: none`, no rubber-band scroll, no double-tap zoom,
  no text selection, no context menu on long-press (that would kill the hold gesture).
- Portrait-first, locked. Cap DPR at 3, target a locked 60fps on an iPhone.
- PWA: manifest (standalone, portrait, theme colour), service worker, generated icons + splash,
  installable to home screen and playable offline.
- **Minimum font size 16px everywhere** - every label, HUD number, codex entry, tooltip. Franz's rule.
  If it does not fit at 16px, change the layout, never the type size.

---

## 3. GATES + SHIPPING

```bash
npm run typecheck && npm run lint && npm run test && npm run build   # ALL must pass, hard gate
npm run selfplay                                                     # balance sane
```
Then:
1. `git init`, meaningful commits in present tense, push to GitHub (`gh repo create knightfight
   --public --source=. --push`; gh here is authed as Arthur-Ficial, that is fine).
2. **Deploy to Cloudflare Pages** (wrangler on this Mac is already authed to Franz's account
   `ecf21e85812dfa5b2a35245257fc71f5` via `CLOUDFLARE_API_TOKEN`):
   `wrangler pages deploy ./dist --project-name=knightfight`
3. **Custom domain `knightfight.franzai.com`** on that Pages project (zone
   `11bfe82c00e8c9e116e1e542b140f172`). Use the Pages custom-domain API/wrangler; verify DNS resolves
   and HTTPS serves 200.
4. **Verify like a human would, with evidence:**
   - `agent-browser open https://knightfight.franzai.com` at iPhone viewport (390x844, DPR 3),
     snapshot + screenshots of: title, mid-fight, parry moment, boon pick, death screen.
   - Zero console errors, zero failed requests.
   - Drive real gesture input (synthetic pointer events) and prove a duel can be won and lost.
   - Confirm 60fps and that nothing scrolls, zooms or selects.
5. Write `README.md` (what it is, how to play, gesture table), `docs/EASTER-EGGS.md`,
   `docs/BALANCE.md`, `CLAUDE.md` (architecture for future sessions), `STATUS.md` (final report).
6. **Tell Franz out loud when done** (he is not at this screen):
   `ssh franz-mac 'say "Franz, Knightfight is live at knightfight dot franzai dot com"'`

## 4. DEFINITION OF DONE
- Live, HTTPS, on knightfight.franzai.com, loads under 2s, works offline after first load.
- Playable one-handed on an iPhone with gestures ONLY - no buttons anywhere.
- Combat feels weighty: hit-stop, shake, sparks, slow-mo kills, readable telegraphs.
- 14+ enemy archetypes appearing progressively, endless affix scaling after.
- 12+ named combos, 30+ boons, meta-progression tree, 7 easter eggs, all documented.
- All gates green, selfplay balance report checked in, `npx cap add ios` works.
- No half-features, no placeholders, no "coming soon", no TODOs.

**No "one honest caveat" ending. Finish it, then report.**
