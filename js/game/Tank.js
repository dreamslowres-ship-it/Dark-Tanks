// Tanque personalizable — movimiento pixel-perfect

import { Entity } from './Entity.js';
import {
  SPRITE_SIZE, DEFAULT_HEALTH, DEFAULT_SPEED,
  DEFAULT_FIRE_RATE, DEFAULT_DAMAGE, DEFAULT_PROJECTILE_SPEED
} from '../utils/constants.js';
import { vecFromAngle } from '../utils/math.js';

function loadImg(src) {
  return new Promise((resolve, reject) => {
    if (!src) return reject(new Error('empty'));
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('fail'));
    img.src = src;
    if (img.complete && img.naturalWidth > 0) resolve(img);
  });
}

/** Color medio del sprite de lámpara (píxeles opacos) */
function sampleLampColor(img) {
  try {
    const c = document.createElement('canvas');
    c.width = img.naturalWidth || 32;
    c.height = img.naturalHeight || 32;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, c.width, c.height).data;
    let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 40) continue;
      // Ignorar píxeles casi negros
      if (data[i] + data[i + 1] + data[i + 2] < 40) continue;
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      n++;
    }
    if (n < 1) return { r: 255, g: 230, b: 140 };
    return {
      r: Math.round(r / n),
      g: Math.round(g / n),
      b: Math.round(b / n)
    };
  } catch {
    return { r: 255, g: 230, b: 140 };
  }
}

export class Tank extends Entity {
  constructor(x, y, skin = null, isLocal = false) {
    super(x, y);
    this.isLocal = isLocal;
    this.isEnemy = !isLocal;
    this.skin = skin || {};
    this.name = skin?.name || (isLocal ? 'Tú' : 'Enemigo');

    this.maxHealth = skin?.stats?.health ?? DEFAULT_HEALTH;
    this.health = this.maxHealth;
    this.speed = skin?.stats?.speed ?? DEFAULT_SPEED;
    this.damage = skin?.stats?.damage ?? DEFAULT_DAMAGE;
    this.fireRate = skin?.stats?.fireRate ?? DEFAULT_FIRE_RATE;
    this.projectileSpeed = skin?.stats?.projectileSpeed ?? DEFAULT_PROJECTILE_SPEED;

    this.weaponAngle = 0;
    this.lampOn = true;
    this.lampColor = { r: 255, g: 230, b: 140 };
    this.lastShot = 0;
    this.radius = SPRITE_SIZE * 0.42;
    this.alive = true;
    this.respawnTimer = 0;
    this.kills = 0;

    this.trailPoints = [];
    this.trailTimer = 0;
    this.lampOffset = 11;

    // Acumuladores sub-pixel estilo Game Boy (se mueve de 1 en 1 px)
    this._mx = 0;
    this._my = 0;

    this.images = { body: null, weapon: null, trail: null, lamp: null, projectile: null };
    this.imagesReady = false;
    this._loadImages();
  }

  async _loadImages() {
    for (const piece of ['body', 'weapon', 'trail', 'lamp', 'projectile']) {
      const src = this.skin[piece];
      if (!src || typeof src !== 'string') continue;
      try {
        this.images[piece] = await loadImg(src);
        if (piece === 'lamp' && this.images.lamp) {
          this.lampColor = sampleLampColor(this.images.lamp);
        }
      } catch (_) {}
    }
    this.imagesReady = true;
  }

  update(dt, input = null) {
    if (!this.alive) {
      this.respawnTimer -= dt;
      return;
    }

    if (this.isLocal && input) {
      const mx = input.moveX || 0;
      const my = input.moveY || 0;
      const len = Math.hypot(mx, my);
      if (len > 0.1) {
        // Movimiento estilo 8-bit: acumular y avanzar en píxeles enteros
        this._mx += (mx / len) * this.speed * dt;
        this._my += (my / len) * this.speed * dt;
        const sx = Math.trunc(this._mx);
        const sy = Math.trunc(this._my);
        if (sx !== 0 || sy !== 0) {
          this.x += sx;
          this.y += sy;
          this._mx -= sx;
          this._my -= sy;
          this.rotation = Math.atan2(my, mx);
        }
      }

      // Aim SOLO si el input trae hasAim o vector de stick derecho activo
      const ax = input.aimX;
      const ay = input.aimY;
      if (ax !== undefined && ay !== undefined) {
        const al = Math.hypot(ax, ay);
        if (al > 0.12) {
          this.weaponAngle = Math.atan2(ay, ax);
        }
      }
    }

    this.trailTimer += dt;
    if (this.trailTimer > 0.09) {
      this.trailTimer = 0;
      this.trailPoints.push({ x: Math.round(this.x), y: Math.round(this.y), life: 0.45 });
      if (this.trailPoints.length > 12) this.trailPoints.shift();
    }
    this.trailPoints = this.trailPoints.filter((p) => (p.life -= dt) > 0);
  }

  tryShoot() {
    if (!this.alive) return null;
    const now = performance.now() / 1000;
    if (now - this.lastShot < 1 / this.fireRate) return null;
    this.lastShot = now;
    const off = vecFromAngle(this.weaponAngle, SPRITE_SIZE * 0.55);
    return {
      x: Math.round(this.x + off.x),
      y: Math.round(this.y + off.y),
      angle: this.weaponAngle,
      speed: this.projectileSpeed,
      damage: this.damage,
      ownerId: this.id,
      skinProjectile: this.skin.projectile || null
    };
  }

  takeDamage(amount, attacker = null) {
    if (!this.alive) return false;
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.alive = false;
      this.active = false;
      this.respawnTimer = 2.8;
      if (attacker) attacker.kills = (attacker.kills || 0) + 1;
      return true;
    }
    return false;
  }

  respawn(x, y) {
    this.x = Math.round(x);
    this.y = Math.round(y);
    this.health = this.maxHealth;
    this.alive = true;
    this.active = true;
    this.respawnTimer = 0;
    this.trailPoints = [];
    this._mx = 0;
    this._my = 0;
  }

  render(ctx) {
    ctx.imageSmoothingEnabled = false;
    const px = Math.round(this.x);
    const py = Math.round(this.y);

    if (!this.alive) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.translate(px, py);
      ctx.fillStyle = '#f44';
      ctx.fillRect(-8, -8, 16, 16);
      ctx.restore();
      return;
    }

    for (const p of this.trailPoints) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life * 0.4);
      if (this.images.trail?.complete) {
        ctx.drawImage(this.images.trail, Math.round(p.x) - 16, Math.round(p.y) - 16, 32, 32);
      } else {
        ctx.fillStyle = 'rgba(50,40,25,0.5)';
        ctx.fillRect(Math.round(p.x) - 6, Math.round(p.y) - 3, 12, 6);
      }
      ctx.restore();
    }

    ctx.save();
    ctx.translate(px, py);

    // Cuerpo — rotación en pasos (no ultra-suave 4k)
    ctx.rotate(this.rotation);
    if (this.images.body?.complete && this.images.body.naturalWidth > 0) {
      ctx.drawImage(this.images.body, -16, -16, 32, 32);
    } else {
      ctx.fillStyle = this.isLocal ? '#3d8c4a' : '#8c3d3d';
      ctx.fillRect(-14, -12, 28, 24);
      ctx.fillStyle = '#222';
      ctx.fillRect(-16, -10, 5, 20);
      ctx.fillRect(11, -10, 5, 20);
    }

    // Farol (sprite) al frente
    if (this.lampOn) {
      if (this.images.lamp?.complete) {
        ctx.drawImage(this.images.lamp, this.lampOffset - 8, -8, 16, 16);
      } else {
        const c = this.lampColor;
        ctx.fillStyle = `rgb(${c.r},${c.g},${c.b})`;
        ctx.fillRect(this.lampOffset, -3, 6, 6);
      }
    }
    ctx.rotate(-this.rotation);

    // Cañón
    ctx.rotate(this.weaponAngle);
    if (this.images.weapon?.complete && this.images.weapon.naturalWidth > 0) {
      ctx.drawImage(this.images.weapon, -16, -16, 32, 32);
    } else {
      ctx.fillStyle = '#6a6a70';
      ctx.fillRect(0, -3, 18, 6);
      ctx.fillStyle = '#444';
      ctx.fillRect(16, -4, 4, 8);
    }

    ctx.restore();

    if (this.health < this.maxHealth) {
      const bw = 28, bh = 3;
      ctx.fillStyle = '#000';
      ctx.fillRect(px - bw / 2, py - 26, bw, bh);
      ctx.fillStyle = this.health > 40 ? '#4c4' : '#c44';
      ctx.fillRect(px - bw / 2, py - 26, bw * (this.health / this.maxHealth), bh);
    }

    if (!this.isLocal) {
      ctx.fillStyle = '#ccc';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(this.name, px, py - 30);
    }
  }
}
