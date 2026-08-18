// Genera una plantilla vacía con zonas marcadas para dibujar skins a mano

import { SPRITE_SIZE } from '../utils/constants.js';
import { getPackLayout } from './SkinPacker.js';

/**
 * Genera un PNG de plantilla (96x64) con bordes y etiquetas de cada zona.
 * El jugador puede descargarlo, dibujar encima en un editor de pixel art
 * y luego importarlo de vuelta.
 */
export function generateTemplate() {
  const layout = getPackLayout();
  const canvas = document.createElement('canvas');
  canvas.width = layout.width;
  canvas.height = layout.height;
  const ctx = canvas.getContext('2d');

  // Fondo oscuro
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, layout.width, layout.height);

  const labels = {
    body: 'BODY',
    weapon: 'WEAPON',
    projectile: 'PROJ',
    trail: 'TRAIL',
    lamp: 'LAMP'
  };

  const pieces = Object.keys(labels);

  for (const piece of pieces) {
    const pos = layout[piece];
    // Celda
    ctx.strokeStyle = '#4a6aaf';
    ctx.lineWidth = 1;
    ctx.strokeRect(pos.x + 0.5, pos.y + 0.5, SPRITE_SIZE - 1, SPRITE_SIZE - 1);

    // Cruz de centro (especialmente útil para el arma)
    ctx.strokeStyle = '#3a4a6a';
    ctx.beginPath();
    ctx.moveTo(pos.x + 16, pos.y);
    ctx.lineTo(pos.x + 16, pos.y + 32);
    ctx.moveTo(pos.x, pos.y + 16);
    ctx.lineTo(pos.x + 32, pos.y + 16);
    ctx.stroke();

    // Etiqueta
    ctx.fillStyle = '#6a8acf';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(labels[piece], pos.x + 16, pos.y + 28);
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}
