// Comportamiento de la lámpara / cono de luz

import { SPRITE_SIZE } from '../utils/constants.js';

export class Light {
  constructor(owner) {
    this.owner = owner; // referencia al Tank
    this.radius = 180;  // alcance de la luz
    this.coneAngle = Math.PI * 0.7; // ~126 grados
    this.enabled = true;
  }

  /**
   * Dibuja la máscara de oscuridad con un agujero de luz alrededor del dueño.
   * Se llama después de dibujar el mundo y las entidades.
   */
  render(ctx, canvasWidth, canvasHeight) {
    if (!this.enabled || !this.owner || !this.owner.active) return;

    // Capa de oscuridad
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Recortar un círculo / cono de luz
    ctx.globalCompositeOperation = 'destination-out';

    const x = this.owner.x;
    const y = this.owner.y;
    const angle = this.owner.weaponAngle; // la luz sigue el arma (o el cuerpo)

    // Círculo suave
    const gradient = ctx.createRadialGradient(x, y, 10, x, y, this.radius);
    gradient.addColorStop(0, 'rgba(0,0,0,1)');
    gradient.addColorStop(0.6, 'rgba(0,0,0,0.7)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  toggle() {
    this.enabled = !this.enabled;
  }
}
