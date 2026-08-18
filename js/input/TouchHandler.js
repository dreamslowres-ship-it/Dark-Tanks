// Manejo de eventos táctiles y prevención de gestos del sistema

export class TouchHandler {
  constructor(element) {
    this.element = element || document.body;
    this.touches = new Map();

    this._onStart = this._onStart.bind(this);
    this._onMove = this._onMove.bind(this);
    this._onEnd = this._onEnd.bind(this);

    this.element.addEventListener('touchstart', this._onStart, { passive: false });
    this.element.addEventListener('touchmove', this._onMove, { passive: false });
    this.element.addEventListener('touchend', this._onEnd, { passive: false });
    this.element.addEventListener('touchcancel', this._onEnd, { passive: false });

    // Prevenir zoom y scroll
    document.addEventListener('gesturestart', e => e.preventDefault());
  }

  _onStart(e) {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      this.touches.set(touch.identifier, {
        id: touch.identifier,
        startX: touch.clientX,
        startY: touch.clientY,
        x: touch.clientX,
        y: touch.clientY
      });
    }
  }

  _onMove(e) {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      const t = this.touches.get(touch.identifier);
      if (t) {
        t.x = touch.clientX;
        t.y = touch.clientY;
      }
    }
  }

  _onEnd(e) {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      this.touches.delete(touch.identifier);
    }
  }

  getTouches() {
    return Array.from(this.touches.values());
  }

  destroy() {
    this.element.removeEventListener('touchstart', this._onStart);
    this.element.removeEventListener('touchmove', this._onMove);
    this.element.removeEventListener('touchend', this._onEnd);
    this.element.removeEventListener('touchcancel', this._onEnd);
  }
}
