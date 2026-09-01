# Knightfight — architecture notes for future sessions

Retro, gesture-only, endless knight-duelling game. TypeScript strict, Vite, zero heavy
runtime deps, zero external assets. Deployed to Cloudflare Pages at knightfight.franzai.com,
architected to wrap as a native iOS app (Capacitor) with no rewrite.

## The golden rules (don't break these)
- **Gestures only.** No fight buttons anywhere. Input is tap/hold/swipe/multi-touch → gestures
  → `Intent[]`. The sim ONLY ever sees Intents (`src/core/types.ts` `Intent`).
- **The sim is pure and deterministic.** `src/sim/` has no DOM and no I/O except a threaded
  seeded RNG. `stepDuel(state, intents)` advances exactly one 1/60s tick. Same seed + same
  intents = same fight. This is what makes it testable and replayable — keep it that way.
- **`src/config/` is the single source of truth.** Every damage number, timing, colour, enemy,
  boon, combo and upgrade lives there. Never hardcode a tunable elsewhere.
- **`base: './'`** in `vite.config.ts` is mandatory (iOS bundle needs relative paths).
- **16px minimum** for every piece of text (HUD is canvas, menus are DOM).

## Layout
- `config/` tunables (SSOT) · `core/` types, rng, loop, events, log, math
- `sim/` pure combat: `step.ts` orchestrates player-actions → player-tick → enemy(ai/fsm) →
  resolve-player (attack) → projectiles → specials. `defense.ts` is the parry/block/dodge read.
- `input/` recognizer (`recognizer.ts`) + `intents.ts` (gesture→Intent, gated by unlocks)
- `render/` `canvas2d/` (procedural skeleton, cape verlet, fx, background, hud, post) +
  `headless/` (tests/selfplay). `renderer.ts` is the swap seam.
- `audio/` procedural WebAudio: context/unlock, synth primitives, sfx, chiptune `music.ts`
- `platform/` storage/haptics/viewport — the iOS swap seam
- `ui/` DOM overlays (title/boon/death/codex/meta/dev) — NEVER shown during a fight
- `app/` `game.ts` state machine (title→duel→boon→death→menu), input pump, persistence, eggs

## Gates (all must pass)
`npm run typecheck && npm run lint && npm run test && npm run build`, plus `npm run selfplay`
for the balance report (`docs/BALANCE.md`). Files ≤250 lines (lint-enforced). No `any`,
explicit return types, named exports.

## Debugging
`window.__KF_LOG.tail(20)` dumps the sim event ring-buffer. Long-press the title logo for
the dev overlay. Balance-tune via `scripts/bot.ts` + `scripts/selfplay.ts`.

## Deploy
`npm run build` then `wrangler pages deploy ./dist --project-name=knightfight`. The custom
domain `knightfight.franzai.com` must be a Pages custom domain — it OVERRIDES a wildcard DNS
parking record on `franzai.com` (see `DEPLOY-NOTES.md`). Verify the served body contains the
app and NOT `easyname`/`domainparking`.
