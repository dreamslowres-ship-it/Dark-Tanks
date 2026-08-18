// Sistema de movimiento (opcional, arquitectura ECS)

export class MovementSystem {
  update(entities, dt) {
    for (const entity of entities) {
      if (entity.velocity) {
        entity.x += entity.velocity.x * dt;
        entity.y += entity.velocity.y * dt;
      }
    }
  }
}
