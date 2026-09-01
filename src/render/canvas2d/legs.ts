import { lerp } from '../../core/math.ts';

// Foot planting so the knight does not skate: feet stay put during the idle bob
// (which only moves vertically) and take a quick step only when the body has
// travelled far enough (a dodge, lunge or walk).

export class Legs {
  private feet: [number, number] | null = null;

  update(bodyX: number, stance: number): [number, number] {
    const targetL = bodyX - stance;
    const targetR = bodyX + stance;
    if (this.feet === null) {
      this.feet = [targetL, targetR];
      return this.feet;
    }
    const step = stance * 1.5;
    this.feet[0] = Math.abs(this.feet[0] - targetL) > step ? lerp(this.feet[0], targetL, 0.55) : this.feet[0];
    this.feet[1] = Math.abs(this.feet[1] - targetR) > step ? lerp(this.feet[1], targetR, 0.55) : this.feet[1];
    return this.feet;
  }
}
