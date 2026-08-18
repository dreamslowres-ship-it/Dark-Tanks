// Sistema de render (opcional)

export class RenderSystem {
  render(ctx, entities, camera) {
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // Ordenar por capa si existe
    const sorted = [...entities].sort((a, b) => (a.layer || 0) - (b.layer || 0));

    for (const entity of sorted) {
      if (entity.active && entity.render) {
        entity.render(ctx);
      }
    }

    ctx.restore();
  }
}
