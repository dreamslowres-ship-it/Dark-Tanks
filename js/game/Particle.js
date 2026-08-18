// Sistema simple de partículas / explosiones

export class Particle {
  constructor(x, y, options = {}) {
    this.x = x;
    this.y = y;
    this.vx = options.vx ?? (Math.random() - 0.5) * 120;
    this.vy = options.vy ?? (Math.random() - 0.5) * 120;
    this.life = options.life ?? 0.5;
    this.maxLife = this.life;
    this.size = options.size ?? (3 + Math.random() * 4);
    this.color = options.color ?? '#ff6622';
    this.active = true;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= 0.92;
    this.vy *= 0.92;
    this.life -= dt;
    if (this.life <= 0) this.active = false;
  }

  render(ctx) {
    if (!this.active) return;
    const a = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * a, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function spawnExplosion(x, y, count = 12) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const speed = 60 + Math.random() * 140;
    particles.push(new Particle(x, y, {
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.35 + Math.random() * 0.35,
      size: 3 + Math.random() * 5,
      color: Math.random() > 0.4 ? '#ff6622' : '#ffcc44'
    }));
  }
  return particles;
}
