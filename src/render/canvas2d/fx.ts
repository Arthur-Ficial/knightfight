import { PALETTE } from '../../config/index.ts';

// Particle + decal system: sparks on parry/hit, blood that pools into lasting
// floor decals, dust on dodge, drifting embers. All procedural, all transient
// except decals which persist for the duel.

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  grav: number;
  blood: boolean;
}

interface Decal {
  x: number;
  y: number;
  r: number;
  color: string;
}

const rand = (a: number, b: number): number => a + Math.random() * (b - a);
const DECAL_CAP = 60;

export class FxSystem {
  private particles: Particle[] = [];
  private readonly decals: Decal[] = [];

  private add(x: number, y: number, color: string, opts: { spread: number; up: number; size: number; life: number; grav: number; blood: boolean }): void {
    this.particles.push({
      x, y,
      vx: rand(-opts.spread, opts.spread),
      vy: rand(-opts.up, opts.up * 0.2),
      life: opts.life, max: opts.life, size: opts.size, color, grav: opts.grav, blood: opts.blood,
    });
  }

  sparks(x: number, y: number, n = 6): void {
    for (let i = 0; i < n; i += 1) {
      this.add(x, y, i % 2 === 0 ? PALETTE.spark : PALETTE.torch0, { spread: 2.2, up: 2.4, size: rand(1, 1.6), life: rand(10, 18), grav: 0.12, blood: false });
    }
  }

  blood(x: number, y: number, n = 7): void {
    for (let i = 0; i < n; i += 1) {
      this.add(x, y, PALETTE.blood, { spread: 1.8, up: 2.2, size: rand(1, 1.8), life: rand(16, 30), grav: 0.22, blood: true });
    }
  }

  dust(x: number, y: number): void {
    for (let i = 0; i < 5; i += 1) {
      this.add(x, y, PALETTE.dust, { spread: 1.4, up: 0.9, size: rand(1, 2), life: rand(14, 24), grav: -0.01, blood: false });
    }
  }

  ember(x: number, y: number): void {
    this.add(x, y, PALETTE.ember, { spread: 0.15, up: 0.7, size: rand(1, 1.4), life: rand(80, 150), grav: -0.012, blood: false });
  }

  update(groundY: number): void {
    const next: Particle[] = [];
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.grav;
      p.life -= 1;
      if (p.blood && p.y >= groundY) {
        if (this.decals.length < DECAL_CAP) {
          this.decals.push({ x: p.x, y: groundY - 1, r: rand(1, 2.4), color: PALETTE.bloodDark });
        }
        continue;
      }
      if (p.life > 0) {
        next.push(p);
      }
    }
    this.particles = next;
  }

  drawDecals(ctx: CanvasRenderingContext2D): void {
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = PALETTE.bloodDark;
    for (const d of this.decals) {
      const r = Math.max(1, Math.round(d.r));
      ctx.fillRect(Math.round(d.x - r), Math.round(d.y), r * 2, 1);
    }
    ctx.globalAlpha = 1;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      const s = Math.max(1, Math.round(p.size));
      ctx.fillRect(Math.round(p.x), Math.round(p.y), s, s);
    }
    ctx.globalAlpha = 1;
  }
}
