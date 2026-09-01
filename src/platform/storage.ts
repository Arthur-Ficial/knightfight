// Storage seam. localStorage today, Capacitor Preferences later - callers only
// see this synchronous key/value + JSON helper, so the swap is one file.

export interface KeyValue {
  get(key: string): string | null;
  set(key: string, value: string): void;
}

const NAMESPACE = 'kf:';

class LocalKeyValue implements KeyValue {
  get(key: string): string | null {
    try {
      return globalThis.localStorage?.getItem(NAMESPACE + key) ?? null;
    } catch {
      return null;
    }
  }

  set(key: string, value: string): void {
    try {
      globalThis.localStorage?.setItem(NAMESPACE + key, value);
    } catch {
      // storage unavailable (private mode / SSR) - play stateless, never crash.
    }
  }
}

export const storage: KeyValue = new LocalKeyValue();

export const loadJson = <T>(key: string, fallback: T): T => {
  const raw = storage.get(key);
  if (raw === null) {
    return fallback;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const saveJson = (key: string, value: unknown): void => {
  storage.set(key, JSON.stringify(value));
};
