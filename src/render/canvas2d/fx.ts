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
const DECAL_CAP = 140;

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

  sparks(x: number, y: number, n = 10): void {
    for (let i = 0; i < n; i += 1) {
      this.add(x, y, i % 2 === 0 ? PALETTE.spark : PALETTE.torch0, { spread: 5, up: 5, size: rand(1.5, 3), life: rand(14, 26), grav: 0.18, blood: false });
    }
  }

  blood(x: number, y: number, n = 12): void {
    for (let i = 0; i < n; i += 1) {
      this.add(x, y, PALETTE.blood, { spread: 4, up: 4.5, size: rand(2, 4), life: rand(20, 40), grav: 0.4, blood: true });
    }
  }

  dust(x: number, y: number): void {
    for (let i = 0; i < 8; i += 1) {
      this.add(x, y, PALETTE.dust, { spread: 3, up: 1.5, size: rand(2, 5), life: rand(16, 28), grav: -0.02, blood: false });
    }
  }

  ember(x: number, y: number): void {
    this.add(x, y, PALETTE.ember, { spread: 0.4, up: 1.6, size: rand(1, 2.4), life: rand(60, 120), grav: -0.03, blood: false });
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
          this.decals.push({ x: p.x, y: groundY - 1, r: rand(2, 5), color: PALETTE.bloodDark });
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
    for (const d of this.decals) {
      ctx.fillStyle = d.color;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.ellipse(d.x, d.y, d.r, d.r * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }
}
