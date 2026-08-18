// Joystick: touch + mouse, arrastre en window

export class Joystick {
  constructor(element, options = {}) {
    this.el = element;
    this.maxRadius = options.maxRadius || 56;
    this.active = false;
    this.vector = { x: 0, y: 0 };
    this.pointerId = null;

    this._onDown = this._onDown.bind(this);
    this._onMove = this._onMove.bind(this);
    this._onUp = this._onUp.bind(this);
    this._onTouchStart = this._onTouchStart.bind(this);
    this._onTouchMove = this._onTouchMove.bind(this);
    this._onTouchEnd = this._onTouchEnd.bind(this);

    this.el.style.touchAction = 'none';
    this.el.addEventListener('pointerdown', this._onDown, { passive: false });
    this.el.addEventListener('touchstart', this._onTouchStart, { passive: false });
  }

  _getCenter() {
    const rect = this.el.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }

  _onDown(e) {
    e.preventDefault();
    e.stopPropagation();
    if (this.active) return;
    this.active = true;
    this.pointerId = e.pointerId;
    try { this.el.setPointerCapture(e.pointerId); } catch (_) {}
    window.addEventListener('pointermove', this._onMove, { passive: false });
    window.addEventListener('pointerup', this._onUp, { passive: false });
    window.addEventListener('pointercancel', this._onUp, { passive: false });
    this._update(e.clientX, e.clientY);
  }

  _onMove(e) {
    if (!this.active) return;
    if (this.pointerId != null && e.pointerId !== this.pointerId) return;
    e.preventDefault();
    this._update(e.clientX, e.clientY);
  }

  _onUp(e) {
    if (this.pointerId != null && e.pointerId !== this.pointerId) return;
    this._release();
  }

  _onTouchStart(e) {
    e.preventDefault();
    e.stopPropagation();
    if (this.active) return;
    const t = e.changedTouches[0];
    if (!t) return;
    this.active = true;
    this.pointerId = t.identifier;
    window.addEventListener('touchmove', this._onTouchMove, { passive: false });
    window.addEventListener('touchend', this._onTouchEnd, { passive: false });
    window.addEventListener('touchcancel', this._onTouchEnd, { passive: false });
    this._update(t.clientX, t.clientY);
  }

  _onTouchMove(e) {
    if (!this.active) return;
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier === this.pointerId) {
        this._update(t.clientX, t.clientY);
        break;
      }
    }
  }

  _onTouchEnd(e) {
    for (const t of e.changedTouches) {
      if (t.identifier === this.pointerId) {
        this._release();
        break;
      }
    }
  }

  _release() {
    this.active = false;
    this.pointerId = null;
    this.vector.x = 0;
    this.vector.y = 0;
    this._setKnob(0, 0);
    window.removeEventListener('pointermove', this._onMove);
    window.removeEventListener('pointerup', this._onUp);
    window.removeEventListener('pointercancel', this._onUp);
    window.removeEventListener('touchmove', this._onTouchMove);
    window.removeEventListener('touchend', this._onTouchEnd);
    window.removeEventListener('touchcancel', this._onTouchEnd);
  }

  _update(clientX, clientY) {
    const center = this._getCenter();
    let dx = clientX - center.x;
    let dy = clientY - center.y;
    const dist = Math.hypot(dx, dy);
    if (dist > this.maxRadius) {
      dx = (dx / dist) * this.maxRadius;
      dy = (dy / dist) * this.maxRadius;
    }
    this.vector.x = dx / this.maxRadius;
    this.vector.y = dy / this.maxRadius;
    this._setKnob(dx, dy);
  }

  _setKnob(dx, dy) {
    this.el.style.setProperty('--knob-x', `${dx}px`);
    this.el.style.setProperty('--knob-y', `${dy}px`);
  }

  getVector() {
    return { x: this.vector.x, y: this.vector.y };
  }

  destroy() {
    this._release();
    this.el.removeEventListener('pointerdown', this._onDown);
    this.el.removeEventListener('touchstart', this._onTouchStart);
  }
}
