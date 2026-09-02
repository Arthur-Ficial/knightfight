import type { Dir4 } from '../core/types.ts';

// THE single source of truth for "attack direction -> correct directional answer".
// It is deliberately identity: you meet an attack on its own line. The PLAYER
// dodges this direction (defense.ts), and the ENEMY counters in this direction
// (enemy.ts). One rule, used by both sides, so the read can never drift apart.
// The counter for an overhead is not the counter for a thrust, a rising cut or a
// back sweep - precisely because each carries a different Dir4.
export const counterDirForAttack = (attackDir: Dir4): Dir4 => attackDir;
