import { UPGRADES, UPGRADE_BY_ID } from '../config/index.ts';
import type { ModBag } from '../config/boons.ts';
import type { GestureUnlock } from '../config/meta.ts';
import { asUpgradeId } from '../core/types.ts';

// Persistent, cross-run progression. Valor buys upgrade ranks; some ranks unlock
// gestures. Pure transforms over a plain-data MetaState (persisted by platform).

export interface MetaState {
  valor: number;
  upgradeRanks: Record<string, number>;
  bestRung: number;
  eggsFound: string[];
  combosFound: string[];
  muted: boolean;
  crt: boolean;
  bloodMoon: boolean;
  chickenKnight: boolean;
  reviveBankedDay: number;
  pendingRevive: boolean;
}

export const createMeta = (): MetaState => ({
  valor: 0,
  upgradeRanks: {},
  bestRung: 0,
  eggsFound: [],
  combosFound: [],
  muted: false,
  crt: true,
  bloodMoon: false,
  chickenKnight: false,
  reviveBankedDay: -1,
  pendingRevive: false,
});

export const rankOf = (meta: MetaState, id: string): number => meta.upgradeRanks[id] ?? 0;

export const upgradeCost = (id: string, rank: number): number => {
  const def = UPGRADE_BY_ID.get(asUpgradeId(id));
  return def ? def.cost * (rank + 1) : Infinity;
};

export const canAfford = (meta: MetaState, id: string): boolean => {
  const def = UPGRADE_BY_ID.get(asUpgradeId(id));
  if (def === undefined) {
    return false;
  }
  const rank = rankOf(meta, id);
  return rank < def.maxRank && meta.valor >= upgradeCost(id, rank);
};

export const purchaseUpgrade = (meta: MetaState, id: string): boolean => {
  if (!canAfford(meta, id)) {
    return false;
  }
  const rank = rankOf(meta, id);
  meta.valor -= upgradeCost(id, rank);
  meta.upgradeRanks[id] = rank + 1;
  return true;
};

export const metaModBags = (meta: MetaState): ModBag[] => {
  const bags: ModBag[] = [];
  for (const def of UPGRADES) {
    const rank = rankOf(meta, def.id);
    if (rank > 0 && def.effect.kind === 'mod') {
      const scaled: ModBag = {};
      for (const key of Object.keys(def.effect.mods) as (keyof ModBag)[]) {
        scaled[key] = (def.effect.mods[key] ?? 0) * rank;
      }
      bags.push(scaled);
    }
  }
  return bags;
};

export const unlockedGestures = (meta: MetaState): Set<GestureUnlock> => {
  const set = new Set<GestureUnlock>();
  for (const def of UPGRADES) {
    if (def.effect.kind === 'unlock' && rankOf(meta, def.id) > 0) {
      set.add(def.effect.gesture);
    }
  }
  return set;
};
