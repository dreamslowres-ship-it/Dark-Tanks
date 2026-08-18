// Motor principal — offline (IA) o multijugador 2P (sin IA)

import { World } from './World.js';
import { Tank } from './Tank.js';
import { Projectile } from './Projectile.js';
import { EnemyAI } from './EnemyAI.js';
import { spawnExplosion } from './Particle.js';
import { createDefaultSkin, createEnemySkin } from '../utils/DefaultAssets.js';
import { circleCollision } from '../utils/math.js';

export class GameEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.running = false;
    this.lastTime = 0;

    this.world = new World(1800, 1400);
    this.world.generateDefaultObstacles();

    this.tanks = [];
    this.projectiles = [];
    this.particles = [];
    this.ais = [];
    this.localTank = null;
    this.remoteTank = null;

    this.camera = { x: 0, y: 0 };
    this.score = 0;
    this.kills = 0;
    this.gameTime = 0;

    this.input = { moveX: 0, moveY: 0, aimX: 1, aimY: 0, shooting: false };

    this.onKill = null;
    this.onDeath = null;
    this.onShoot = null;

    this.zoom = 2.25;
    this.minZoom = 1.4;
    this.maxZoom = 3.5;

    this.multiplayer = false;
    this.session = null;
    this.isHost = true;
    this._netTimer = 0;
    this._netHandler = null;

    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  _resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  setZoom(z) {
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, z));
  }

  adjustZoom(delta) {
    this.setZoom(this.zoom + delta);
  }

  /**
   * @param localSkin
   * @param options {{ multiplayer?, session?, isHost?, remoteSkin?, remoteName? }}
   */
  start(localSkin = null, options = {}) {
    this.tanks = [];
    this.projectiles = [];
    this.particles = [];
    this.ais = [];
    this.score = 0;
    this.kills = 0;
    this.gameTime = 0;
    this.remoteTank = null;

    this.multiplayer = !!options.multiplayer;
    this.session = options.session || null;
    this.isHost = options.isHost !== false;

    const playerSkin = localSkin && (localSkin.body || localSkin.weapon)
      ? localSkin
      : createDefaultSkin('#3d8c4a');

    const lx = this.world.width / 2 + (this.multiplayer ? (this.isHost ? -100 : 100) : 0);
    const ly = this.world.height / 2;

    this.localTank = new Tank(lx, ly, playerSkin, true);
    this.localTank.name = playerSkin.tankName || playerSkin.name || 'Tú';
    this.tanks.push(this.localTank);

    if (this.multiplayer) {
      const rs = options.remoteSkin || createDefaultSkin('#8c3d3d');
      const rx = this.world.width / 2 + (this.isHost ? 100 : -100);
      this.remoteTank = new Tank(rx, ly, rs, false);
      this.remoteTank.name = options.remoteName || rs.tankName || rs.name || 'Rival';
      this.remoteTank.isEnemy = true;
      this.tanks.push(this.remoteTank);

      if (this.session) {
        this._netHandler = (msg) => this._onNetMessage(msg);
        this.session.on('message', this._netHandler);
      }
    } else {
      const hues = [0, 210, 280];
      const positions = [[280, 280], [1520, 280], [900, 1120]];
      for (let i = 0; i < 3; i++) {
        const skin = createEnemySkin(hues[i]);
        const enemy = new Tank(positions[i][0], positions[i][1], skin, false);
        this.tanks.push(enemy);
        this.ais.push(new EnemyAI(enemy, this.localTank));
      }
    }

    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this._loop(t));
  }

  stop() {
    this.running = false;
    if (this.session && this._netHandler) {
      // no remove API — session may be reused
    }
  }

  setInput(input) {
    Object.assign(this.input, input);
  }

  _loop(timestamp) {
    if (!this.running) return;
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;
    this.update(dt);
    this.render();
    requestAnimationFrame((t) => this._loop(t));
  }

  update(dt) {
    this.gameTime += dt;

    if (this.localTank) {
      if (!this.localTank.alive && this.localTank.respawnTimer <= 0) {
        const rx = 200 + Math.random() * (this.world.width - 400);
        const ry = 200 + Math.random() * (this.world.height - 400);
        this.localTank.respawn(rx, ry);
      }
      this.localTank.update(dt, this.input);
      this.world.resolveCollision(this.localTank);

      if (this.input.shooting && this.localTank.alive) {
        const shot = this.localTank.tryShoot();
        if (shot) {
          this._spawnProjectile(shot);
          this.onShoot?.();
          if (this.multiplayer) {
            this._netSend({ type: 'shoot', shot });
          }
        }
      }
    }

    // Solo IA en offline
    if (!this.multiplayer) {
      for (const ai of this.ais) {
        const tank = ai.tank;
        if (!tank.alive) {
          if (tank.respawnTimer <= 0) {
            tank.respawn(
              150 + Math.random() * (this.world.width - 300),
              150 + Math.random() * (this.world.height - 300)
            );
          }
          continue;
        }
        ai.setTarget(this.localTank);
        ai.update(dt, this.world);
        if (ai.wantsToShoot(this.world)) {
          const shot = tank.tryShoot();
          if (shot) this._spawnProjectile(shot);
        }
      }
    } else if (this.remoteTank && !this.remoteTank.alive && this.remoteTank.respawnTimer <= 0) {
      // El dueño remoto enviará respawn por red; host puede auto-respawn visual
      this.remoteTank.respawnTimer -= dt;
    }

    this.world.separateTanks(this.tanks);
    for (const t of this.tanks) {
      if (t.alive) this.world.resolveCollision(t);
    }

    for (const p of this.projectiles) p.update(dt);

    for (const p of this.projectiles) {
      if (!p.active) continue;
      for (const tank of this.tanks) {
        if (!tank.alive || tank.id === p.ownerId) continue;
        if (circleCollision(p.x, p.y, p.radius, tank.x, tank.y, tank.radius)) {
          p.destroy();
          const attacker = this.tanks.find((x) => x.id === p.ownerId) || null;
          const died = tank.takeDamage(p.damage, attacker);
          this.particles.push(...spawnExplosion(p.x, p.y, died ? 16 : 7));
          if (died) {
            if (attacker && attacker.isLocal) {
              this.kills++;
              this.score += 100;
              this.onKill?.(tank);
            }
            if (tank.isLocal) this.onDeath?.();
          }
          break;
        }
      }
    }

    for (const p of this.projectiles) {
      if (!p.active) continue;
      for (const obs of this.world.obstacles) {
        if (p.x > obs.x && p.x < obs.x + obs.w && p.y > obs.y && p.y < obs.y + obs.h) {
          p.destroy();
          this.particles.push(...spawnExplosion(p.x, p.y, 5));
          break;
        }
      }
    }

    this.projectiles = this.projectiles.filter((p) => p.active);
    for (const pt of this.particles) pt.update(dt);
    this.particles = this.particles.filter((pt) => pt.active);

    // Enviar estado local ~20 Hz
    if (this.multiplayer && this.session && this.localTank) {
      this._netTimer += dt;
      if (this._netTimer >= 0.05) {
        this._netTimer = 0;
        const t = this.localTank;
        this._netSend({
          type: 'state',
          x: t.x,
          y: t.y,
          rotation: t.rotation,
          weaponAngle: t.weaponAngle,
          health: t.health,
          alive: t.alive,
          name: t.name
        });
      }
    }

    // Cámara
    if (this.localTank) {
      const z = this.zoom;
      const viewW = this.canvas.width / z;
      const viewH = this.canvas.height / z;
      let targetX = this.localTank.x - viewW / 2;
      let targetY = this.localTank.y - viewH / 2;
      const ww = this.world.width;
      const wh = this.world.height;
      if (viewW >= ww) targetX = (ww - viewW) / 2;
      else targetX = Math.max(0, Math.min(ww - viewW, targetX));
      if (viewH >= wh) targetY = (wh - viewH) / 2;
      else targetY = Math.max(0, Math.min(wh - viewH, targetY));
      this.camera.x += (targetX - this.camera.x) * 0.18;
      this.camera.y += (targetY - this.camera.y) * 0.18;
    }
  }

  _netSend(msg) {
    try { this.session?.send(msg); } catch (_) {}
  }

  _onNetMessage(msg) {
    if (!msg || !msg.type) return;
    if (msg.type === 'state' && this.remoteTank) {
      const t = this.remoteTank;
      t.x = msg.x;
      t.y = msg.y;
      t.rotation = msg.rotation;
      t.weaponAngle = msg.weaponAngle;
      t.health = msg.health;
      t.alive = msg.alive;
      if (msg.name) t.name = msg.name;
      if (!msg.alive && t.respawnTimer <= 0) t.respawnTimer = 2.5;
    }
    if (msg.type === 'shoot' && msg.shot) {
      // Proyectil remoto: ownerId distinto del local
      const s = msg.shot;
      if (this.remoteTank) s.ownerId = this.remoteTank.id;
      this._spawnProjectile(s);
    }
  }

  _spawnProjectile(shot) {
    this.projectiles.push(
      new Projectile(
        shot.x, shot.y, shot.angle, shot.speed,
        shot.damage, shot.ownerId, shot.skinProjectile
      )
    );
  }

  render() {
    const ctx = this.ctx;
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    ctx.clearRect(0, 0, cw, ch);
    ctx.imageSmoothingEnabled = false;

    const z = this.zoom;
    const camX = Math.round(this.camera.x);
    const camY = Math.round(this.camera.y);

    ctx.save();
    ctx.scale(z, z);
    ctx.translate(-camX, -camY);
    this.world.render(ctx);
    for (const pt of this.particles) pt.render(ctx);
    for (const tank of this.tanks) tank.render(ctx);
    for (const p of this.projectiles) p.render(ctx);
    ctx.restore();

    this._renderLighting(ctx, camX, camY, z);
  }

  _renderLighting(ctx, camX, camY, z) {
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const tank = this.localTank;
    if (!tank) return;

    const lx = (tank.x - camX) * z;
    const ly = (tank.y - camY) * z;
    const angle = tank.alive ? tank.weaponAngle : 0;
    const col = tank.lampColor || { r: 255, g: 230, b: 140 };

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    // Oscuridad fuerte fuera del alcance de la lámpara
    // (solo se ve bien cerca / en el cono — hay que acercarse para enfrentarse)
    const maxR = Math.hypot(cw, ch);
    const vig = ctx.createRadialGradient(lx, ly, 40 * z, lx, ly, maxR);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(0.22, 'rgba(0,0,0,0.15)');
    vig.addColorStop(0.45, 'rgba(0,0,5,0.55)');
    vig.addColorStop(0.7, 'rgba(0,0,8,0.82)');
    vig.addColorStop(1, 'rgba(0,0,10,0.92)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, cw, ch);

    if (!tank.alive) {
      ctx.restore();
      return;
    }

    // Claridad suave del farol (color del sprite)
    const gr = 100 * z;
    const glow = ctx.createRadialGradient(lx, ly, 2 * z, lx, ly, gr);
    glow.addColorStop(0, `rgba(${col.r},${col.g},${col.b},0.2)`);
    glow.addColorStop(0.5, `rgba(${col.r},${col.g},${col.b},0.06)`);
    glow.addColorStop(1, `rgba(${col.r},${col.g},${col.b},0)`);
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(lx, ly, gr, 0, Math.PI * 2);
    ctx.fill();

    // Cono
    ctx.translate(lx, ly);
    ctx.rotate(angle);
    const coneLen = 200 * z;
    const cone = ctx.createLinearGradient(0, 0, coneLen, 0);
    cone.addColorStop(0, `rgba(${col.r},${col.g},${col.b},0.16)`);
    cone.addColorStop(0.55, `rgba(${col.r},${col.g},${col.b},0.05)`);
    cone.addColorStop(1, `rgba(${col.r},${col.g},${col.b},0)`);
    ctx.fillStyle = cone;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(coneLen, -50 * z);
    ctx.lineTo(coneLen, 50 * z);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Rival solo visible si está relativamente cerca (glow mínimo)
    if (this.remoteTank && this.remoteTank.alive) {
      const dx = this.remoteTank.x - tank.x;
      const dy = this.remoteTank.y - tank.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 280) {
        const ex = (this.remoteTank.x - camX) * z;
        const ey = (this.remoteTank.y - camY) * z;
        const eg = ctx.createRadialGradient(ex, ey, 2, ex, ey, 40 * z);
        eg.addColorStop(0, 'rgba(255,200,120,0.12)');
        eg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = eg;
        ctx.beginPath();
        ctx.arc(ex, ey, 40 * z, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  getStats() {
    return {
      kills: this.kills,
      score: this.score,
      health: this.localTank ? this.localTank.health : 0,
      maxHealth: this.localTank ? this.localTank.maxHealth : 100,
      alive: this.localTank ? this.localTank.alive : false,
      time: this.gameTime,
      zoom: this.zoom
    };
  }
}
