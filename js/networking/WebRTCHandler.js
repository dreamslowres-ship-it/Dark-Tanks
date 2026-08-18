// Manejo de conexiones WebRTC DataChannel para multijugador local WiFi

/**
 * Nota: Para WebRTC puro entre dispositivos en la misma red se necesita
 * un servidor de señalización (aunque sea local). Ver server/index.js.
 */

export class WebRTCHandler {
  constructor() {
    this.pc = null;
    this.dataChannel = null;
    this.onMessage = null;
    this.onConnected = null;
  }

  async createOffer() {
    this.pc = new RTCPeerConnection({
      iceServers: [] // local, sin STUN/TURN necesarios en LAN ideal
    });

    this.dataChannel = this.pc.createDataChannel('game', { ordered: true });
    this._setupChannel(this.dataChannel);

    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    return offer;
  }

  async acceptOffer(offer) {
    this.pc = new RTCPeerConnection({ iceServers: [] });

    this.pc.ondatachannel = (event) => {
      this.dataChannel = event.channel;
      this._setupChannel(this.dataChannel);
    };

    await this.pc.setRemoteDescription(offer);
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    return answer;
  }

  async acceptAnswer(answer) {
    await this.pc.setRemoteDescription(answer);
  }

  _setupChannel(channel) {
    channel.onopen = () => {
      console.log('[WebRTC] DataChannel abierto');
      this.onConnected?.(true);
    };
    channel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.onMessage?.(data);
      } catch (e) {
        console.warn('[WebRTC] Mensaje no JSON', e);
      }
    };
    channel.onclose = () => {
      this.onConnected?.(false);
    };
  }

  send(data) {
    if (this.dataChannel?.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(data));
    }
  }

  close() {
    this.dataChannel?.close();
    this.pc?.close();
  }
}
