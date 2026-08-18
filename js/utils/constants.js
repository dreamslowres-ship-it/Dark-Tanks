// Constantes globales de Night Tanks

export const TILE_SIZE = 32;
export const SPRITE_SIZE = 32; // Todos los assets personalizables son 32x32

export const MAX_PLAYERS = 10;
export const MAX_PLAYERS_PER_TEAM = 5;

export const DEFAULT_HEALTH = 100;
export const DEFAULT_SPEED = 120; // px/s
export const DEFAULT_FIRE_RATE = 4; // disparos por segundo
export const DEFAULT_PROJECTILE_SPEED = 320;
export const DEFAULT_DAMAGE = 20;

// Capas de render (orden de dibujado)
export const LAYER = {
  TRAIL: 0,
  BODY: 1,
  LAMP: 2,
  WEAPON: 3,
  PROJECTILE: 4,
  FX: 5,
  UI: 10
};

// Colores base
export const COLORS = {
  BACKGROUND: '#05050a',
  DARKNESS: 'rgba(0,0,0,0.85)',
  LIGHT: 'rgba(255, 240, 180, 0.35)',
  ACCENT: '#5af'
};

// Configuración de red
export const NETWORK = {
  SIGNALING_PORT: 3000,
  MAX_PACKET_SIZE: 65535,
  SKIN_SEND_TIMEOUT: 15000 // ms
};

// Balance (puntos de estadísticas)
export const BALANCE_POINTS = 100; // puntos totales disponibles por defecto

export const STAT_COSTS = {
  health: 1,
  speed: 2,
  damage: 3,
  fireRate: 4,
  projectileSpeed: 1
};
