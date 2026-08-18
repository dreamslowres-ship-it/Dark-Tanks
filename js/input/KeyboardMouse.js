// Teclado + ratón (PC). NO interfiere con touch/móvil.

export class KeyboardMouse {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = {};
    this.mouse = { x: 0, y: 0, down: false, moved: false };
    // Solo activo si el último input fue ratón/teclado (no touch)
    this.useMouseAim = false;
    this.enabled = true;

    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      this.useMouseAim = true;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Touch en la página => desactivar aim por ratón
    window.addEventListener('touchstart', () => {
      this.useMouseAim = false;
      this.mouse.down = false;
    }, { passive: true });

    canvas.addEventListener('mousemove', (e) => {
      // Solo si no es un evento sintético de touch
      if (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) return;
      if (e.pointerType === 'touch') return;
      this.useMouseAim = true;
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
      this.mouse.moved = true;
    });

    canvas.addEventListener('mousedown', (e) => {
      if (e.pointerType === 'touch') return;
      if (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) return;
      this.useMouseAim = true;
      this.mouse.down = true;
    });
    canvas.addEventListener('mouseup', () => { this.mouse.down = false; });
    canvas.addEventListener('mouseleave', () => { this.mouse.down = false; });
  }

  getState(camera, playerPos, zoom = 1) {
    if (!this.enabled) {
      return { moveX: 0, moveY: 0, aimX: 0, aimY: 0, shooting: false, hasAim: false };
    }

    let moveX = 0;
    let moveY = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveY -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveY += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;

    let aimX = 0;
    let aimY = 0;
    let hasAim = false;
    let shooting = false;

    // Apuntar SOLO con ratón real en PC, nunca con taps táctiles
    if (this.useMouseAim && playerPos && this.mouse.moved) {
      const z = zoom || 1;
      const worldMouseX = (camera?.x || 0) + this.mouse.x / z;
      const worldMouseY = (camera?.y || 0) + this.mouse.y / z;
      aimX = worldMouseX - playerPos.x;
      aimY = worldMouseY - playerPos.y;
      const len = Math.hypot(aimX, aimY) || 1;
      aimX /= len;
      aimY /= len;
      hasAim = true;
      shooting = this.mouse.down || !!this.keys['Space'];
    } else if (this.keys['Space']) {
      shooting = true;
    }

    return { moveX, moveY, aimX, aimY, shooting, hasAim };
  }
}
