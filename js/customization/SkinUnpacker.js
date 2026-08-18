// Extrae las piezas 32x32 de un PNG empaquetado

import { SPRITE_SIZE } from '../utils/constants.js';
import { loadImage, extractSprite, imageToBase64 } from '../utils/imageLoader.js';
import { getPackLayout } from './SkinPacker.js';

/**
 * Desempaqueta un PNG (File/Blob/URL) y devuelve un objeto skin parcial.
 */
export async function unpackSkin(source) {
  const img = await loadImage(source);
  const layout = getPackLayout();

  // Validación mínima de tamaño del pack
  if (img.naturalWidth < layout.width || img.naturalHeight < layout.height) {
    throw new Error(
      `PNG empaquetado demasiado pequeño. Se esperaba al menos ${layout.width}x${layout.height}`
    );
  }

  const skin = {
    body: null,
    weapon: null,
    projectile: null,
    trail: null,
    lamp: null
  };

  const pieces = Object.keys(layout).filter(k => typeof layout[k] === 'object');

  for (const piece of pieces) {
    const pos = layout[piece];
    const spriteCanvas = extractSprite(img, pos.x, pos.y);

    // Comprobar si la pieza no está vacía (tiene algún píxel no transparente)
    const ctx = spriteCanvas.getContext('2d');
    const data = ctx.getImageData(0, 0, SPRITE_SIZE, SPRITE_SIZE).data;
    let hasContent = false;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 10) { // alpha > 10
        hasContent = true;
        break;
      }
    }

    if (hasContent) {
      skin[piece] = imageToBase64(spriteCanvas);
    }
  }

  return skin;
}
