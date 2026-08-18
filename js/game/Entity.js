// Clase base para todas las entidades del juego

export class Entity {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
    this.rotation = 0; // radianes
    this.active = true;
    this.id = Entity._nextId++;
  }

  update(dt) {
    // Override en subclases
  }

  render(ctx) {
    // Override en subclases
  }

  destroy() {
    this.active = false;
  }
}

Entity._nextId = 1;
