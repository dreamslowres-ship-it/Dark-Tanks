// Sprites pixel-art 32x32 profesionales generados proceduralmente

import { SPRITE_SIZE } from './constants.js';

function c() {
  const canvas = document.createElement('canvas');
  canvas.width = SPRITE_SIZE;
  canvas.height = SPRITE_SIZE;
  return canvas;
}

function px(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function shade(hex, amount) {
  if (!hex || !hex.startsWith('#')) return hex || '#888';
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  r = Math.max(0, Math.min(255, r + amount));
  g = Math.max(0, Math.min(255, g + amount));
  b = Math.max(0, Math.min(255, b + amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/** Cuerpo del tanque - frente hacia la derecha */
export function createDefaultBody(primary = '#3d8c4a') {
  const canvas = c();
  const ctx = canvas.getContext('2d');
  const dark = shade(primary, -40);
  const light = shade(primary, 30);
  const track = '#1a1a1e';
  const trackHi = '#333';

  rect(ctx, 1, 8, 5, 16, track);
  rect(ctx, 26, 8, 5, 16, track);
  for (let y = 9; y < 23; y += 3) {
    rect(ctx, 2, y, 3, 1, trackHi);
    rect(ctx, 27, y, 3, 1, trackHi);
  }

  rect(ctx, 5, 9, 22, 14, primary);
  rect(ctx, 6, 9, 20, 3, light);
  rect(ctx, 6, 20, 20, 2, dark);

  rect(ctx, 10, 11, 12, 8, shade(primary, -15));
  rect(ctx, 11, 12, 10, 3, light);
  rect(ctx, 14, 13, 4, 3, dark);

  // Faros delanteros integrados (derecha = frente)
  rect(ctx, 24, 11, 3, 2, '#ffe066');
  rect(ctx, 24, 19, 3, 2, '#ffe066');
  px(ctx, 25, 11, '#fff8c0');
  px(ctx, 25, 19, '#fff8c0');

  return canvas;
}

/** Cañón - pivote centro (16,16) */
export function createDefaultWeapon() {
  const canvas = c();
  const ctx = canvas.getContext('2d');
  rect(ctx, 11, 12, 8, 8, '#4a4a52');
  rect(ctx, 12, 13, 6, 2, '#6a6a72');
  rect(ctx, 16, 14, 13, 4, '#6a6a70');
  rect(ctx, 16, 14, 13, 1, '#8a8a90');
  rect(ctx, 16, 17, 13, 1, '#4a4a50');
  rect(ctx, 28, 13, 3, 6, '#3a3a40');
  rect(ctx, 29, 14, 2, 4, '#555');
  rect(ctx, 22, 13, 2, 6, '#55555c');
  return canvas;
}

export function createDefaultProjectile() {
  const canvas = c();
  const ctx = canvas.getContext('2d');
  rect(ctx, 6, 14, 8, 4, 'rgba(255,140,40,0.35)');
  rect(ctx, 12, 13, 10, 6, '#e85a20');
  rect(ctx, 14, 14, 6, 4, '#ff8844');
  rect(ctx, 22, 14, 4, 4, '#ffcc44');
  px(ctx, 24, 15, '#fff');
  px(ctx, 24, 16, '#fff');
  return canvas;
}

export function createDefaultTrail() {
  const canvas = c();
  const ctx = canvas.getContext('2d');
  ctx.globalAlpha = 0.45;
  rect(ctx, 8, 12, 16, 3, '#3a3020');
  rect(ctx, 10, 17, 12, 2, '#2a2518');
  ctx.globalAlpha = 1;
  return canvas;
}

/** Farol / lámpara - se coloca en la parte delantera del tanque */
export function createDefaultLamp() {
  const canvas = c();
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(16, 16, 2, 16, 16, 12);
  g.addColorStop(0, 'rgba(255,240,180,0.75)');
  g.addColorStop(0.5, 'rgba(255,220,120,0.28)');
  g.addColorStop(1, 'rgba(255,200,80,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(16, 16, 12, 0, Math.PI * 2);
  ctx.fill();
  rect(ctx, 12, 12, 8, 8, '#c8a830');
  rect(ctx, 13, 13, 6, 6, '#ffe066');
  rect(ctx, 14, 14, 4, 4, '#fff8c0');
  px(ctx, 15, 15, '#fff');
  return canvas;
}

export function canvasToDataURL(canvas) {
  return canvas.toDataURL('image/png');
}

export function createDefaultSkin(color = '#3d8c4a') {
  return {
    id: 'default',
    name: 'Tanque Básico',
    body: canvasToDataURL(createDefaultBody(color)),
    weapon: canvasToDataURL(createDefaultWeapon()),
    projectile: canvasToDataURL(createDefaultProjectile()),
    trail: canvasToDataURL(createDefaultTrail()),
    lamp: canvasToDataURL(createDefaultLamp()),
    stats: {
      health: 100,
      speed: 135,
      damage: 24,
      fireRate: 3.8,
      projectileSpeed: 360
    }
  };
}

export function createEnemySkin(hue = 0) {
  const color = hslToHex(hue, 50, 38);
  const skin = createDefaultSkin(color);
  skin.id = `enemy_${hue}`;
  skin.name = ['Rojo', 'Naranja', 'Azul', 'Violeta', 'Teal'][Math.floor(hue / 72) % 5] || 'Enemigo';
  skin.stats = { health: 60, speed: 85, damage: 12, fireRate: 1.4, projectileSpeed: 280 };
  return skin;
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}
