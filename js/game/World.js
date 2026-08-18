// Mapa, obstáculos y colisiones

export class World {
  constructor(width = 1800, height = 1400) {
    this.width = width;
    this.height = height;
    this.obstacles = [];
  }

  generateDefaultObstacles() {
    this.obstacles = [
      { x: 350, y: 250, w: 140, h: 40 },
      { x: 700, y: 500, w: 50, h: 180 },
      { x: 1100, y: 180, w: 220, h: 45 },
      { x: 500, y: 900, w: 90, h: 90 },
      { x: 1300, y: 700, w: 160, h: 40 },
      { x: 200, y: 600, w: 40, h: 140 },
      { x: 900, y: 1000, w: 180, h: 40 },
      { x: 1500, y: 400, w: 50, h: 120 },
      { x: 800, y: 250, w: 80, h: 80 },
      { x: 1000, y: 550, w: 100, h: 30 }
    ];
  }

  resolveCollision(entity) {
    const r = entity.radius || 14;

    entity.x = Math.max(r, Math.min(this.width - r, entity.x));
    entity.y = Math.max(r, Math.min(this.height - r, entity.y));

    for (const obs of this.obstacles) {
      const closestX = Math.max(obs.x, Math.min(entity.x, obs.x + obs.w));
      const closestY = Math.max(obs.y, Math.min(entity.y, obs.y + obs.h));
      const dx = entity.x - closestX;
      const dy = entity.y - closestY;
      const dist = Math.hypot(dx, dy);

      if (dist < r) {
        if (dist < 0.001) {
          entity.x += r;
        } else {
          const overlap = r - dist;
          entity.x += (dx / dist) * overlap;
          entity.y += (dy / dist) * overlap;
        }
      }
    }
  }

  /** Separación tanque ↔ tanque */
  separateTanks(tanks) {
    for (let i = 0; i < tanks.length; i++) {
      const a = tanks[i];
      if (!a.alive) continue;
      for (let j = i + 1; j < tanks.length; j++) {
        const b = tanks[j];
        if (!b.alive) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);
        const minDist = (a.radius || 14) + (b.radius || 14);
        if (dist < minDist && dist > 0.001) {
          const overlap = (minDist - dist) / 2;
          const nx = dx / dist;
          const ny = dy / dist;
          a.x -= nx * overlap;
          a.y -= ny * overlap;
          b.x += nx * overlap;
          b.y += ny * overlap;
        } else if (dist < 0.001) {
          a.x -= minDist / 2;
          b.x += minDist / 2;
        }
      }
    }
  }

  /** ¿Hay obstáculo entre dos puntos? (raycast simple) */
  hasLineOfSight(x1, y1, x2, y2) {
    const steps = 12;
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const x = x1 + (x2 - x1) * t;
      const y = y1 + (y2 - y1) * t;
      for (const obs of this.obstacles) {
        if (x >= obs.x && x <= obs.x + obs.w && y >= obs.y && y <= obs.y + obs.h) {
          return false;
        }
      }
    }
    return true;
  }

  render(ctx) {
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.strokeStyle = 'rgba(40, 50, 80, 0.28)';
    ctx.lineWidth = 1;
    const grid = 64;
    for (let x = 0; x <= this.width; x += grid) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    for (let y = 0; y <= this.height; y += grid) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }

    ctx.fillStyle = '#2a3040';
    ctx.strokeStyle = '#4a5560';
    for (const obs of this.obstacles) {
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
      ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
    }
  }
}
