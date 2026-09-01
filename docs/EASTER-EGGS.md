# Knightfight — Easter Eggs

Seven hidden things. Locations in code are given so you can find your own eggs.

### 1. Chicken Knight
On the **title screen**, perform the gesture code:
**swipe up, up, down, down, left, right, left, right, then double-tap.**
Unlocks the Chicken Knight skin (comb on the head) and a rubber-chicken weapon.
Persists in your save.
*Code: `src/app/easter-eggs.ts` `CHICKEN_CODE`, detected in `game.ts` `titleGesture`.*

### 2. Blood Moon
**Tap the moon** in the title-screen background **10 times.** The moon turns red, the
sky darkens into permanent Blood Moon night mode. Persists.
*Code: `game.ts` `titleGesture` + `overlays.hitMoon`; moon drawn in `render/canvas2d/background.ts`.*

### 3. The Metronome
Land **7 perfect parries in a row** in a single duel. The secret relic *The Metronome*
(wider parry window + riposte damage) is granted mid-run.
*Code: emitted by the sim in `src/sim/defense.ts` (`special: 'metronome'` at `METRONOME_STREAK`),
granted in `game.ts` `absorbEvents`.*

### 4. Idle knight
Leave the **title screen** idle. After 60s the knight rests; after 3 minutes he sleeps.
*Thresholds: `src/config/timings.ts` `IDLE_SIT_MS`, `IDLE_SLEEP_MS`.*

### 5. The Hooded Duelist
Reach **rung 33** and a mysterious hooded duelist appears out of ladder order (banner:
"A HOODED DUELIST APPEARS").
*Code: `src/app/easter-eggs.ts` `RUNG_HOODED`, handled in `game.ts` `startDuel`.*

### 6. Dev overlay
**Long-press the game logo for 5 seconds** on the title screen to open the dev overlay
with live sim stats (also useful for debugging). The full sim event ring-buffer is always
readable from the browser console via `window.__KF_LOG.tail(20)`.
*Code: `LOGO_HOLD_MS` in `easter-eggs.ts`, `overlays.bindLogoHold`.*

### 7. Heart of mercy
On the **death screen**, draw a heart (a looping circle gesture) to bank a revive for your
next run — once per day.
*Code: death-screen gesture handling in `game.ts` `onGesture`.*
