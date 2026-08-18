/**
 * Multijugador 2P con CÓDIGO CORTO (4 caracteres).
 * PeerJS sigue mediando la señalización; el ID visible es tipo "A7K2".
 */

const PREFIX = 'nt'; // prefijo interno PeerJS

function randomCode(len = 4) {
  // Sin caracteres confusos (0/O, 1/I)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[(Math.random() * chars.length) | 0];
  return s;
}

function toPeerId(code) {
  return PREFIX + String(code).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function toDisplayCode(peerId) {
  if (!peerId) return '';
  const s = String(peerId);
  if (s.toLowerCase().startsWith(PREFIX)) return s.slice(PREFIX.length).toUpperCase();
  return s.toUpperCase();
}

export class MultiplayerSession {
  constructor() {
    this.peer = null;
    this.conn = null;
    this.isHost = false;
    this.peerId = null;
    this.roomCode = null;
    this.remoteId = null;
    this.handlers = {};
    this.connected = false;
  }

  on(event, fn) {
    this.handlers[event] = fn;
  }

  _emit(event, data) {
    this.handlers[event]?.(data);
  }

  async _ensurePeerJS() {
    if (window.Peer) return;
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
      s.onload = resolve;
      s.onerror = () => reject(new Error('No se pudo cargar la red (¿sin internet?)'));
      document.head.appendChild(s);
    });
  }

  /**
   * Crea sala con código corto de 4 caracteres (reintenta si está ocupado).
   * @returns {Promise<string>} código visible (ej. "A7K2")
   */
  async host() {
    await this._ensurePeerJS();
    this.isHost = true;
    this.closePeerOnly();

    const maxTries = 8;
    let lastErr = null;

    for (let i = 0; i < maxTries; i++) {
      const code = randomCode(4);
      const peerId = toPeerId(code);
      try {
        const id = await this._openAs(peerId);
        this.peerId = id;
        this.roomCode = toDisplayCode(id);
        this.peer.on('connection', (conn) => {
          this.conn = conn;
          this._bindConn(conn);
        });
        return this.roomCode;
      } catch (e) {
        lastErr = e;
        try { this.peer?.destroy(); } catch (_) {}
        this.peer = null;
      }
    }
    throw lastErr || new Error('No se pudo crear sala. Intenta de nuevo.');
  }

  /**
   * @param {string} code código corto de 4 caracteres
   */
  async join(code) {
    await this._ensurePeerJS();
    this.isHost = false;
    this.closePeerOnly();

    const clean = String(code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (clean.length < 3) throw new Error('Código demasiado corto');

    const hostPeerId = toPeerId(clean);

    return new Promise((resolve, reject) => {
      this.peer = new window.Peer({ debug: 0 });
      const timeout = setTimeout(() => reject(new Error('Tiempo de espera agotado')), 20000);

      this.peer.on('open', () => {
        this.peerId = this.peer.id;
        this.roomCode = clean;
        const conn = this.peer.connect(hostPeerId, { reliable: true });
        this.conn = conn;
        this._bindConn(conn);
        conn.on('open', () => {
          clearTimeout(timeout);
          resolve(this.roomCode);
        });
        conn.on('error', (e) => {
          clearTimeout(timeout);
          reject(e);
        });
      });
      this.peer.on('error', (e) => {
        clearTimeout(timeout);
        const msg = (e && e.type === 'peer-unavailable')
          ? 'Sala no encontrada. Revisa el código.'
          : (e?.message || String(e));
        reject(new Error(msg));
      });
    });
  }

  _openAs(peerId) {
    return new Promise((resolve, reject) => {
      this.peer = new window.Peer(peerId, { debug: 0 });
      const t = setTimeout(() => reject(new Error('timeout host')), 12000);
      this.peer.on('open', (id) => {
        clearTimeout(t);
        resolve(id);
      });
      this.peer.on('error', (e) => {
        clearTimeout(t);
        reject(e);
      });
    });
  }

  _bindConn(conn) {
    conn.on('open', () => {
      this.connected = true;
      this.remoteId = conn.peer;
      this._emit('connected', { remoteId: conn.peer, isHost: this.isHost });
    });
    conn.on('data', (data) => {
      try {
        const msg = typeof data === 'string' ? JSON.parse(data) : data;
        this._emit('message', msg);
      } catch (_) {}
    });
    conn.on('close', () => {
      this.connected = false;
      this._emit('disconnected');
    });
    conn.on('error', (e) => this._emit('error', e));
  }

  send(msg) {
    if (this.conn && this.conn.open) {
      try {
        this.conn.send(msg);
      } catch (_) {
        try { this.conn.send(JSON.stringify(msg)); } catch (__) {}
      }
    }
  }

  closePeerOnly() {
    try { this.conn?.close(); } catch (_) {}
    try { this.peer?.destroy(); } catch (_) {}
    this.conn = null;
    this.peer = null;
    this.connected = false;
  }

  close() {
    this.closePeerOnly();
    this.roomCode = null;
    this.peerId = null;
  }
}
