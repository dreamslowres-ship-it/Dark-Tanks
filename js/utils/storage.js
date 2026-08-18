// Envoltorio simple de IndexedDB + localStorage

const DB_NAME = 'NightTanksDB';
const DB_VERSION = 1;
const STORE_SKINS = 'skins';

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_SKINS)) {
        db.createObjectStore(STORE_SKINS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

export async function saveSkin(skin) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SKINS, 'readwrite');
    const store = tx.objectStore(STORE_SKINS);
    const request = store.put(skin);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadSkin(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SKINS, 'readonly');
    const store = tx.objectStore(STORE_SKINS);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllSkins() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SKINS, 'readonly');
    const store = tx.objectStore(STORE_SKINS);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteSkin(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SKINS, 'readwrite');
    const store = tx.objectStore(STORE_SKINS);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Helpers de localStorage para ajustes simples
export function setSetting(key, value) {
  localStorage.setItem(`nt_${key}`, JSON.stringify(value));
}

export function getSetting(key, defaultValue = null) {
  const raw = localStorage.getItem(`nt_${key}`);
  if (raw === null) return defaultValue;
  try {
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}
