// Empaqueta todas las piezas de una skin en un solo PNG organizado por zonas

import { SPRITE_SIZE } from '../utils/constants.js';
import { loadImage } from '../utils/imageLoader.js';

/**
 * Layout del PNG empaquetado (de izquierda a derecha, arriba a abajo):
 * 
 *  [ Body  ] [ Weapon ] [ Projectile ]
 *  [ Trail ] [ Lamp   ] [ (reserva)  ]
 * 
 * Cada celda = 32x32. Total: 96 x 64
 */

const LAYOUT = {
  body:       { x: 0,  y: 0 },
  weapon:     { x: 32, y: 0 },
  projectile: { x: 64, y: 0 },
  trail:      { x: 0,  y: 32 },
  lamp:       { x: 32, y: 32 }
};

const PACK_WIDTH = 96;
const PACK_HEIGHT = 64;

export async function packSkin(skin) {
  const canvas = document.createElement('canvas');
  canvas.width = PACK_WIDTH;
  canvas.height = PACK_HEIGHT;
  const ctx = canvas.getContext('2d');

  // Fondo transparente
  ctx.clearRect(0, 0, PACK_WIDTH, PACK_HEIGHT);

  const pieces = ['body', 'weapon', 'projectile', 'trail', 'lamp'];

  for (const piece of pieces) {
    const data = skin[piece];
    if (!data) continue;

    try {
      const img = await loadImage(data);
      const pos = LAYOUT[piece];
      ctx.drawImage(img, pos.x, pos.y, SPRITE_SIZE, SPRITE_SIZE);
    } catch (e) {
      console.warn(`No se pudo empaquetar pieza ${piece}:`, e);
    }
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/png');
  });
}

export function getPackLayout() {
  return { ...LAYOUT, width: PACK_WIDTH, height: PACK_HEIGHT };
}
