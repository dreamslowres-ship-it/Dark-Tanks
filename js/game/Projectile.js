// Proyectil

import { Entity } from './Entity.js';
import { SPRITE_SIZE } from '../utils/constants.js';
import { loadImage } from '../utils/imageLoader.js';
import { vecFromAngle } from '../utils/math.js';

export class Projectile extends Entity {
  constructor(x, y, angle, speed, damage, ownerId, skinData = null) {
    super(x, y);
    this.angle = angle;
    this.speed = speed;
    this.damage = damage;
    this.ownerId = ownerId;
    this.life = 2.8;
    this.radius = 7;
    this.image = null;

    if (skinData) {
      loadImage(skinData).then(img => { this.image = img; }).catch(() => {});
    }
  }

  update(dt) {
    if (!this.active) return;
    const vel = vecFromAngle(this.angle, this.speed);
    this.x += vel.x * dt;
    this.y += vel.y * dt;
    this.life -= dt;
    if (this.life <= 0) this.destroy();
  }

  render(ctx) {
    if (!this.active) return;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(Math.round(this.x), Math.round(this.y));
    ctx.rotate(this.angle);

    if (this.image) {
      ctx.drawImage(this.image, -SPRITE_SIZE / 2, -SPRITE_SIZE / 2, SPRITE_SIZE, SPRITE_SIZE);
    } else {
      ctx.fillStyle = '#ff6622';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffee88';
      ctx.beginPath();
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
