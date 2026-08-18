// Manejo de Bluetooth vía plugin nativo de Capacitor (máx 2 jugadores)

/**
 * Requiere un plugin de Capacitor para BLE o Bluetooth Classic.
 * Este archivo es un esqueleto listo para conectar cuando se añada el plugin.
 */

export class BluetoothHandler {
  constructor() {
    this.connected = false;
    this.onMessage = null;
  }

  async startAdvertising(roomName) {
    console.warn('[Bluetooth] startAdvertising no implementado (falta plugin Capacitor)');
    // Ejemplo futuro:
    // await BluetoothLE.startAdvertising({ name: roomName });
  }

  async scanAndConnect() {
    console.warn('[Bluetooth] scanAndConnect no implementado (falta plugin Capacitor)');
  }

  send(data) {
    if (!this.connected) return;
    // await BluetoothLE.write({ value: JSON.stringify(data) });
  }

  disconnect() {
    this.connected = false;
  }
}
