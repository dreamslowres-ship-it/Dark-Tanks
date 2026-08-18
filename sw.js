const CACHE = 'night-tanks-v7';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './manifest.json',
  './js/main.js',
  './js/game/GameEngine.js',
  './js/game/Tank.js',
  './js/game/Projectile.js',
  './js/game/World.js',
  './js/game/Light.js',
  './js/game/Entity.js',
  './js/game/EnemyAI.js',
  './js/game/Particle.js',
  './js/customization/SkinManager.js',
  './js/customization/SkinPacker.js',
  './js/customization/SkinUnpacker.js',
  './js/customization/SkinTemplate.js',
  './js/ui/MainMenu.js',
  './js/ui/LobbyUI.js',
  './js/ui/HUD.js',
  './js/ui/Joystick.js',
  './js/ui/Button.js',
  './js/ui/CustomizationUI.js',
  './js/input/InputManager.js',
  './js/input/KeyboardMouse.js',
  './js/input/TouchHandler.js',
  './js/utils/constants.js',
  './js/utils/math.js',
  './js/utils/imageLoader.js',
  './js/utils/storage.js',
  './js/utils/DefaultAssets.js',
  './js/audio/SoundManager.js',
  './js/networking/NetworkManager.js',
  './js/networking/WebRTCHandler.js',
  './js/networking/BluetoothHandler.js',
  './js/networking/SignalingServer.js',
  './data/balance.json',
  './data/defaultSkins.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetched = fetch(e.request).then((res) => {
        if (res && res.status === 200 && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || fetched;
    })
  );
});
