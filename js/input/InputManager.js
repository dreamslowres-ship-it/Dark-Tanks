// Input: joysticks. En móvil el aim SOLO sale del stick derecho.

import { Joystick } from '../ui/Joystick.js';

export class InputManager {
  constructor() {
    this.leftJoystick = null;
    this.rightJoystick = null;
    this.state = {
      moveX: 0,
      moveY: 0,
      aimX: 1,
      aimY: 0,
      shooting: false,
      hasAim: false
    };
    this._lastAimX = 1;
    this._lastAimY = 0;
  }

  init() {
    const leftEl = document.getElementById('joystick-left');
    const rightEl = document.getElementById('joystick-right');
    if (leftEl) this.leftJoystick = new Joystick(leftEl, { maxRadius: 56 });
    if (rightEl) this.rightJoystick = new Joystick(rightEl, { maxRadius: 56 });
  }

  update() {
    this.state.hasAim = false;
    this.state.shooting = false;

    if (this.leftJoystick) {
      const v = this.leftJoystick.getVector();
      this.state.moveX = v.x;
      this.state.moveY = v.y;
    }

    if (this.rightJoystick) {
      const v = this.rightJoystick.getVector();
      const mag = Math.hypot(v.x, v.y);
      if (mag > 0.15) {
        this.state.aimX = v.x;
        this.state.aimY = v.y;
        this._lastAimX = v.x;
        this._lastAimY = v.y;
        this.state.hasAim = true;
        this.state.shooting = true;
      } else {
        // Mantener último ángulo, no disparar
        this.state.aimX = this._lastAimX;
        this.state.aimY = this._lastAimY;
        this.state.shooting = false;
      }
    }

    return this.state;
  }

  destroy() {
    this.leftJoystick?.destroy();
    this.rightJoystick?.destroy();
  }
}
