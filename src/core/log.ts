// Client-side ring buffer an AI (or Franz) can read from the browser console
// via `window.__KF_LOG`. Fixed capacity, newest-last, zero allocations churn.

export interface LogEntry {
  readonly tick: number;
  readonly tag: string;
  readonly data: Readonly<Record<string, number | string | boolean>>;
}

const CAPACITY = 512;

class RingLog {
  private readonly entries: LogEntry[] = [];

  push(entry: LogEntry): void {
    this.entries.push(entry);
    if (this.entries.length > CAPACITY) {
      this.entries.shift();
    }
  }

  dump(): readonly LogEntry[] {
    return this.entries.slice();
  }

  clear(): void {
    this.entries.length = 0;
  }

  tail(count: number): readonly LogEntry[] {
    return this.entries.slice(Math.max(0, this.entries.length - count));
  }
}

export const kfLog = new RingLog();

export const logEvent = (
  tick: number,
  tag: string,
  data: Readonly<Record<string, number | string | boolean>> = {},
): void => {
  kfLog.push({ tick, tag, data });
};

interface KfWindow {
  __KF_LOG?: {
    dump: () => readonly LogEntry[];
    tail: (n: number) => readonly LogEntry[];
    clear: () => void;
  };
}

export const installLogBridge = (target: KfWindow): void => {
  target.__KF_LOG = {
    dump: () => kfLog.dump(),
    tail: (n: number) => kfLog.tail(n),
    clear: () => kfLog.clear(),
  };
};
