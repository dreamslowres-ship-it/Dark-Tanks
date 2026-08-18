// Sistema de colisiones simple (opcional)

import { circleCollision } from '../utils/math.js';

export class CollisionSystem {
  checkProjectilesVsTanks(projectiles, tanks) {
    const hits = [];

    for (const proj of projectiles) {
      if (!proj.active) continue;
      for (const tank of tanks) {
        if (!tank.active || tank.id === proj.ownerId) continue;
        if (circleCollision(proj.x, proj.y, proj.radius, tank.x, tank.y, tank.radius)) {
          hits.push({ projectile: proj, tank });
        }
      }
    }

    return hits;
  }
}
