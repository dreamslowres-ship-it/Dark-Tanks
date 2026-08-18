// Gestor de red: salas, listo, cuenta atrás y sincronización básica

/**
 * Estructura preparada para WebRTC / Bluetooth.
 * En el MVP se puede empezar con un modo "solo local" o con WebRTC DataChannels.
 */

export class NetworkManager {
  constructor() {
    this.isHost = false;
    this.roomId = null;
    this.players = new Map(); // id -> { name, ready, skin, ... }
    this.localPlayerId = null;
    this.onEvent = null; // callback(event, data)
  }

  async createRoom(options = {}) {
    this.isHost = true;
    this.roomId = 'room_' + Math.random().toString(36).slice(2, 8);
    this.localPlayerId = 'host';
    this.players.set(this.localPlayerId, {
      id: this.localPlayerId,
      name: options.name || 'Host',
      ready: false,
      skin: options.skin || null
    });
    return this.roomId;
  }

  async joinRoom(roomId, options = {}) {
    this.isHost = false;
    this.roomId = roomId;
    this.localPlayerId = 'player_' + Math.random().toString(36).slice(2, 6);
    // Aquí se conectaría vía WebRTC / señalización
    console.log('[Network] Intentando unirse a', roomId);
    return true;
  }

  setReady(ready = true) {
    const p = this.players.get(this.localPlayerId);
    if (p) p.ready = ready;
    this._broadcast({ type: 'ready', playerId: this.localPlayerId, ready });
  }

  sendSkin(skin) {
    this._broadcast({ type: 'skin', playerId: this.localPlayerId, skin });
  }

  sendState(state) {
    // Solo datos livianos durante la partida
    this._broadcast({ type: 'state', playerId: this.localPlayerId, state });
  }

  _broadcast(msg) {
    // Placeholder: en implementación real se envía por DataChannel
    console.log('[Network] broadcast', msg);
    if (this.onEvent) this.onEvent(msg.type, msg);
  }

  leave() {
    this.players.clear();
    this.roomId = null;
    this.isHost = false;
  }
}
