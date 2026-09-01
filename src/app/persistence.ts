import { loadJson, saveJson } from '../platform/index.ts';
import { createMeta, type MetaState } from '../sim/meta.ts';

// Load/save persistent progression. Merges defaults so new fields survive a
// schema bump without wiping a save.

const KEY = 'meta';

export const loadMeta = (): MetaState => {
  const saved = loadJson<Partial<MetaState>>(KEY, {});
  return { ...createMeta(), ...saved };
};

export const saveMeta = (meta: MetaState): void => {
  saveJson(KEY, meta);
};
