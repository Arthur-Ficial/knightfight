# Balance root-cause investigation (7 whys) — RESOLVED

## Symptom
`docs/BALANCE.md` showed a skill inversion (novice 8.8 avg > decent 7.9) and all
tiers capped at min rung 7 with 16/16 combat deaths — a hard wall at rung 7.

## Diagnostic (scripts/diag.ts)
Ran the expert bot on each rung in isolation, measuring win rate and the closest
the player ever got to the enemy (melee reach ≈ 46):

```
rung 4: 100%  minGap 41      rung 7: 3%   minGap 49.8   <- WALL
rung 5: 100%  minGap 42      rung 8: 100% minGap 41
rung 6: 97%   minGap 41      rung 9: 97%  minGap 41
```

Rung 7 (Crossbow Knight) — the player literally could not reach melee (49.8 > 46).

## 7 whys
1. Skill did not raise the rung reached → deaths clustered at rung 7.
2. Deaths clustered at rung 7 → 3% win rate vs ~100% at every neighbour.
3. Win rate was 3% → the player never closed to melee reach.
4. The player never closed → the Crossbow (`approachBias -0.7`) retreated at
   `ENEMY_SPEED 1.15 × tempo 0.8 = 0.92 units/tick`, faster than the player closed.
5. The player closed at only `LUNGE_STEP 10 / ~15-tick attack = 0.67 units/tick`,
   and there was no dedicated advance — retreat (0.92) beat closing (0.67).
6. So bolt-RNG, not melee-read accuracy (the only novice/decent difference),
   decided every run → the averages were noise → the inversion.
7. **Root cause:** the player had no way to close on a kiting ranged enemy faster
   than it retreats — unfair for a real player, not just the bot.

## Fix (both sides checked; combat was wrong, not the bot)
- `LUNGE_STEP 10 → 20` so out-of-range attacks close (~1.33/tick) faster than the
  retreat (0.92/tick).
- `RANGED_KEEP 120 → 100` (a closeable kite distance).
- Ranged enemies no longer fire **point-blank** (undodgeable) bolts — `chooseMove`
  excludes ranged shots when the gap is small; they use their melee move instead.
- Ranged enemies stop retreating once pinned in melee (`faceAndMove`), so a caught
  archer must fight — "close the distance between shots" is now a fair, learnable read.

## Result (diag: rungs 4-9 all 100%, no wall) and monotonic selfplay
See `docs/BALANCE.md`: novice < decent < expert, zero timeouts, no wall.
The late curve was also steepened so imperfect defence is punished sooner.
