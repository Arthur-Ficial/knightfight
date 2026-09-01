// Fixed-timestep driver. The sim advances in exact 1/60s ticks regardless of
// display refresh; the renderer interpolates with the leftover alpha. The
// accumulator is pure and unit-testable; the RAF wiring is a thin driver.

export const TICK_HZ = 60;
export const TICK_MS = 1000 / TICK_HZ;
const MAX_CATCHUP_TICKS = 5; // avoid spiral-of-death after a stall

export interface StepPlan {
  readonly ticks: number;
  readonly alpha: number;
  readonly accumulator: number;
}

/** Given leftover accumulator + elapsed ms, decide how many sim ticks to run. */
export const planSteps = (accumulator: number, elapsedMs: number): StepPlan => {
  const clamped = Math.min(elapsedMs, TICK_MS * MAX_CATCHUP_TICKS);
  let acc = accumulator + clamped;
  let ticks = 0;
  while (acc >= TICK_MS && ticks < MAX_CATCHUP_TICKS) {
    acc -= TICK_MS;
    ticks += 1;
  }
  return { ticks, alpha: acc / TICK_MS, accumulator: acc };
};

export interface LoopHandle {
  stop: () => void;
}

export const startLoop = (
  onTick: () => void,
  onRender: (alpha: number) => void,
  now: () => number = () => performance.now(),
  schedule: (cb: () => void) => void = (cb) => {
    requestAnimationFrame(cb);
  },
): LoopHandle => {
  let last = now();
  let accumulator = 0;
  let running = true;
  const frame = (): void => {
    if (!running) {
      return;
    }
    const current = now();
    const plan = planSteps(accumulator, current - last);
    last = current;
    accumulator = plan.accumulator;
    for (let i = 0; i < plan.ticks; i += 1) {
      onTick();
    }
    onRender(plan.alpha);
    schedule(frame);
  };
  schedule(frame);
  return {
    stop: (): void => {
      running = false;
    },
  };
};
