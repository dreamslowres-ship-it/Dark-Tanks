// Carga y validación de imágenes 32x32 (con resize opcional)

import { SPRITE_SIZE } from './constants.js';

/**
 * Carga y valida. Si allowResize=true y no es 32x32, reescala al centro.
 */
export async function loadAndValidateImage(source, allowResize = true) {
  const img = await loadImage(source);
  const w = img.naturalWidth;
  const h = img.naturalHeight;

  if (w === SPRITE_SIZE && h === SPRITE_SIZE) {
    return img;
  }

  if (!allowResize) {
    throw new Error(
      `Imagen inválida: debe ser exactamente ${SPRITE_SIZE}x${SPRITE_SIZE} px. ` +
      `Recibido: ${w}x${h}`
    );
  }

  // Reescalar / letterbox a 32x32
  const canvas = document.createElement('canvas');
  canvas.width = SPRITE_SIZE;
  canvas.height = SPRITE_SIZE;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const scale = Math.min(SPRITE_SIZE / w, SPRITE_SIZE / h);
  const dw = Math.round(w * scale);
  const dh = Math.round(h * scale);
  const dx = Math.floor((SPRITE_SIZE - dw) / 2);
  const dy = Math.floor((SPRITE_SIZE - dh) / 2);
  ctx.clearRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
  ctx.drawImage(img, 0, 0, w, h, dx, dy, dw, dh);

  return loadImage(canvas.toDataURL('image/png'));
}

export function loadImage(source) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo cargar la imagen'));

    if (typeof source === 'string') {
      img.src = source;
    } else if (source instanceof Blob || source instanceof File) {
      img.src = URL.createObjectURL(source);
    } else {
      reject(new Error('Fuente de imagen no soportada'));
    }
  });
}

export function imageToBase64(img) {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL('image/png');
}

export function extractSprite(sourceImg, sx, sy) {
  const canvas = document.createElement('canvas');
  canvas.width = SPRITE_SIZE;
  canvas.height = SPRITE_SIZE;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(
    sourceImg,
    sx, sy, SPRITE_SIZE, SPRITE_SIZE,
    0, 0, SPRITE_SIZE, SPRITE_SIZE
  );
  return canvas;
}
