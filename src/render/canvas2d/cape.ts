// A tiny verlet cloth for the cape. Point 0 is pinned to the shoulder; the rest
// trail with gravity and wind, giving weighty free cloth motion for free.

interface Node {
  x: number;
  y: number;
  ox: number;
  oy: number;
}

const GRAVITY = 0.6;

export class Cape {
  private readonly nodes: Node[] = [];
  private readonly count: number;

  constructor(count = 6) {
    this.count = count;
  }

  update(anchorX: number, anchorY: number, windX: number, seg: number): void {
    if (this.nodes.length === 0) {
      for (let i = 0; i < this.count; i += 1) {
        this.nodes.push({ x: anchorX, y: anchorY + i * seg, ox: anchorX, oy: anchorY + i * seg });
      }
    }
    const head = this.nodes[0];
    if (head !== undefined) {
      head.x = anchorX;
      head.y = anchorY;
      head.ox = anchorX;
      head.oy = anchorY;
    }
    for (let i = 1; i < this.nodes.length; i += 1) {
      const p = this.nodes[i] as Node;
      const vx = (p.x - p.ox) * 0.88;
      const vy = (p.y - p.oy) * 0.88;
      p.ox = p.x;
      p.oy = p.y;
      p.x += vx + windX;
      p.y += vy + GRAVITY;
    }
    for (let k = 0; k < 2; k += 1) {
      for (let i = 1; i < this.nodes.length; i += 1) {
        this.constrain(this.nodes[i - 1] as Node, this.nodes[i] as Node, seg);
      }
    }
  }

  private constrain(a: Node, b: Node, seg: number): void {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.hypot(dx, dy) || 1;
    const diff = (dist - seg) / dist;
    b.x -= dx * diff;
    b.y -= dy * diff;
  }

  points(): [number, number][] {
    return this.nodes.map((n) => [n.x, n.y]);
  }
}
