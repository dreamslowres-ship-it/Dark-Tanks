// IA simple con línea de visión

import { distance, angleBetween } from '../utils/math.js';

export class EnemyAI {
  constructor(tank, target) {
    this.tank = tank;
    this.target = target;
    this.state = 'wander';
    this.wanderAngle = Math.random() * Math.PI * 2;
    this.wanderTimer = 0;
  }

  setTarget(target) {
    this.target = target;
  }

  update(dt, world) {
    const tank = this.tank;
    if (!tank.alive || !this.target) return;

    const dist = distance(tank.x, tank.y, this.target.x, this.target.y);
    const targetAlive = this.target.alive;
    const los = targetAlive && world
      ? world.hasLineOfSight(tank.x, tank.y, this.target.x, this.target.y)
      : false;

    if (targetAlive && dist < 400) {
      this.state = dist < 240 && los ? 'attack' : 'chase';
    } else {
      this.state = 'wander';
    }

    if (this.state === 'wander') {
      this.wanderTimer -= dt;
      if (this.wanderTimer <= 0) {
        this.wanderAngle = Math.random() * Math.PI * 2;
        this.wanderTimer = 1.2 + Math.random() * 2;
      }
      tank.x += Math.cos(this.wanderAngle) * tank.speed * 0.45 * dt;
      tank.y += Math.sin(this.wanderAngle) * tank.speed * 0.45 * dt;
      tank.rotation = this.wanderAngle;
      // Arma sigue un poco el cuerpo en wander
      tank.weaponAngle += (this.wanderAngle - tank.weaponAngle) * Math.min(1, 3 * dt);
    } else {
      const angle = angleBetween(tank.x, tank.y, this.target.x, this.target.y);
      tank.weaponAngle = angle;

      if (this.state === 'chase') {
        tank.x += Math.cos(angle) * tank.speed * 0.8 * dt;
        tank.y += Math.sin(angle) * tank.speed * 0.8 * dt;
        tank.rotation = angle;
      } else {
        // Attack: mantener distancia
        if (dist > 170) {
          tank.x += Math.cos(angle) * tank.speed * 0.55 * dt;
          tank.y += Math.sin(angle) * tank.speed * 0.55 * dt;
        } else if (dist < 100) {
          tank.x -= Math.cos(angle) * tank.speed * 0.5 * dt;
          tank.y -= Math.sin(angle) * tank.speed * 0.5 * dt;
        }
        tank.rotation = angle;
      }
    }

    if (world) world.resolveCollision(tank);
    tank.x = Math.round(tank.x);
    tank.y = Math.round(tank.y);
  }

  wantsToShoot(world) {
    if (!this.tank.alive || !this.target || !this.target.alive) return false;
    if (this.state !== 'attack') return false;
    const dist = distance(this.tank.x, this.tank.y, this.target.x, this.target.y);
    if (dist > 340) return false;
    // Solo dispara con línea de visión
    if (world && !world.hasLineOfSight(this.tank.x, this.tank.y, this.target.x, this.target.y)) {
      return false;
    }
    return true;
  }
}
