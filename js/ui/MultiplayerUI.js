// Flujo multijugador: host/join → lobby (tanques + listo) → carga → partida

import { sound } from '../audio/SoundManager.js';
import { loadImage } from '../utils/imageLoader.js';

export class MultiplayerUI {
  constructor(skinManager, session, callbacks) {
    this.skinManager = skinManager;
    this.session = session;
    this.cb = callbacks; // { onStartGame, onBack }
    this.el = null;
    this.role = null; // host | guest
    this.localReady = false;
    this.remoteReady = false;
    this.localSkin = null;
    this.remoteSkin = null;
    this.remoteName = 'Rival';
    this.selectedId = null;
  }

  open() {
    this._build();
    this._showStep('mp-home');
    this.el.classList.remove('hidden');
    this.el.style.display = '';
  }

  close() {
    this.session.close();
    this.localReady = false;
    this.remoteReady = false;
    if (this.el) {
      this.el.classList.add('hidden');
      this.el.style.display = 'none';
    }
  }

  _build() {
    if (this.el) return;
    this.el = document.createElement('div');
    this.el.id = 'mp-screen';
    this.el.className = 'screen';
    this.el.innerHTML = `
      <div class="panel mp-panel">
        <div id="mp-home" class="mp-step">
          <h2>Multijugador (2 jugadores)</h2>
          <p class="muted">Sin IA. Código corto de 4 letras. Misma sesión / amigos cercanos.</p>
          <button class="btn" id="mp-host">Crear partida</button>
          <button class="btn" id="mp-join">Unirse</button>
          <button class="btn secondary" id="mp-back">Volver</button>
        </div>

        <div id="mp-hosting" class="mp-step hidden">
          <h2>Partida creada</h2>
          <p>Código corto (dilo o escríbelo):</p>
          <div id="mp-room-code" class="room-code">—</div>
          <p class="muted">Ejemplo: A7K2 · Esperando rival…</p>
          <button class="btn secondary" id="mp-cancel-host">Cancelar</button>
        </div>

        <div id="mp-joining" class="mp-step hidden">
          <h2>Unirse</h2>
          <input id="mp-code-input" class="text-input code-input" placeholder="Ej: A7K2" maxlength="8" autocomplete="off" autocapitalize="characters" />
          <button class="btn" id="mp-do-join">Conectar</button>
          <button class="btn secondary" id="mp-cancel-join">Cancelar</button>
        </div>

        <div id="mp-lobby" class="mp-step hidden">
          <h2>Sala de espera</h2>
          <p class="muted">Elige tu tanque y pulsa Listo. La partida empieza cuando ambos estén listos.</p>
          <div class="lobby-cols">
            <div>
              <h3>Tú</h3>
              <div id="mp-local-tanks" class="depot-grid compact"></div>
              <p>Seleccionado: <strong id="mp-local-sel">—</strong></p>
              <p id="mp-local-ready-lbl">No listo</p>
            </div>
            <div>
              <h3>Rival</h3>
              <p id="mp-remote-info">Conectado</p>
              <p id="mp-remote-ready-lbl">No listo</p>
              <canvas id="mp-remote-preview" width="64" height="64" class="depot-preview"></canvas>
            </div>
          </div>
          <div class="row-actions">
            <button class="btn" id="mp-ready">Listo</button>
            <button class="btn secondary" id="mp-leave-lobby">Salir</button>
          </div>
        </div>

        <div id="mp-loading" class="mp-step hidden">
          <h2>Cargando recursos faltantes</h2>
          <p id="mp-loading-msg" class="muted">Sincronizando tanques…</p>
          <div class="load-bar"><div id="mp-load-fill" class="load-fill"></div></div>
        </div>
      </div>`;
    document.getElementById('ui-overlay').appendChild(this.el);

    this.el.querySelector('#mp-back').onclick = () => {
      this.close();
      this.cb.onBack?.();
    };
    this.el.querySelector('#mp-host').onclick = () => this._startHost();
    this.el.querySelector('#mp-join').onclick = () => this._showStep('mp-joining');
    this.el.querySelector('#mp-cancel-host').onclick = () => {
      this.session.close();
      this._showStep('mp-home');
    };
    this.el.querySelector('#mp-cancel-join').onclick = () => this._showStep('mp-home');
    this.el.querySelector('#mp-do-join').onclick = () => this._startJoin();
    const codeIn = this.el.querySelector('#mp-code-input');
    if (codeIn) {
      codeIn.addEventListener('input', () => {
        const pos = codeIn.selectionStart;
        codeIn.value = codeIn.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        codeIn.setSelectionRange(pos, pos);
      });
    }
    this.el.querySelector('#mp-ready').onclick = () => this._toggleReady();
    this.el.querySelector('#mp-leave-lobby').onclick = () => {
      this.session.close();
      this.close();
      this.cb.onBack?.();
    };

    this.session.on('connected', () => this._onConnected());
    this.session.on('message', (msg) => this._onMessage(msg));
    this.session.on('disconnected', () => {
      alert('Rival desconectado');
      this.close();
      this.cb.onBack?.();
    });
  }

  _showStep(id) {
    this.el.querySelectorAll('.mp-step').forEach((s) => {
      s.classList.add('hidden');
      s.style.display = 'none';
    });
    const step = this.el.querySelector('#' + id);
    if (step) {
      step.classList.remove('hidden');
      step.style.display = '';
    }
  }

  async _startHost() {
    try {
      this._showStep('mp-hosting');
      const id = await this.session.host();
      this.role = 'host';
      this.el.querySelector('#mp-room-code').textContent = id;
    } catch (e) {
      alert('Error al crear sala: ' + e.message);
      this._showStep('mp-home');
    }
  }

  async _startJoin() {
    const code = this.el.querySelector('#mp-code-input').value.trim();
    if (!code) return alert('Introduce el código');
    try {
      this.role = 'guest';
      await this.session.join(code);
    } catch (e) {
      alert('Error al unirse: ' + e.message);
      this._showStep('mp-joining');
    }
  }

  async _onConnected() {
    try { sound.playReady(); } catch (_) {}
    this.localSkin = this.skinManager.getCurrent();
    this.selectedId = this.localSkin?.id;
    await this._fillLocalTanks();
    this._showStep('mp-lobby');
    this._send({
      type: 'hello',
      name: this.localSkin?.tankName || this.localSkin?.name || 'Jugador',
      skin: this._skinPayload(this.localSkin)
    });
  }

  async _fillLocalTanks() {
    const box = this.el.querySelector('#mp-local-tanks');
    box.innerHTML = '';
    const list = await this.skinManager.list();
    for (const tank of list) {
      const card = document.createElement('button');
      card.className = 'depot-card mini';
      card.type = 'button';
      const cv = document.createElement('canvas');
      cv.width = 48;
      cv.height = 48;
      this._preview(cv, tank);
      card.appendChild(cv);
      const lab = document.createElement('div');
      lab.textContent = tank.tankName || tank.name;
      card.appendChild(lab);
      if (tank.id === this.selectedId) card.classList.add('selected');
      card.onclick = () => {
        this.selectedId = tank.id;
        this.localSkin = tank;
        this.skinManager.setCurrent(tank);
        this.localReady = false;
        this._updateReadyLabels();
        box.querySelectorAll('.depot-card').forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');
        this.el.querySelector('#mp-local-sel').textContent = tank.tankName || tank.name;
        this._send({
          type: 'skin',
          name: tank.tankName || tank.name,
          skin: this._skinPayload(tank),
          ready: false
        });
      };
      box.appendChild(card);
    }
    const cur = list.find((t) => t.id === this.selectedId) || list[0];
    if (cur) {
      this.localSkin = cur;
      this.el.querySelector('#mp-local-sel').textContent = cur.tankName || cur.name;
    }
  }

  _skinPayload(skin) {
    if (!skin) return null;
    return {
      id: skin.id,
      name: skin.tankName || skin.name,
      tankName: skin.tankName || skin.name,
      body: skin.body,
      weapon: skin.weapon,
      projectile: skin.projectile,
      trail: skin.trail,
      lamp: skin.lamp,
      stats: skin.stats
    };
  }

  _toggleReady() {
    if (!this.localSkin) return alert('Elige un tanque');
    this.localReady = !this.localReady;
    this._updateReadyLabels();
    this._send({
      type: 'ready',
      ready: this.localReady,
      skin: this._skinPayload(this.localSkin),
      name: this.localSkin.tankName || this.localSkin.name
    });
    this._tryStart();
  }

  _updateReadyLabels() {
    this.el.querySelector('#mp-local-ready-lbl').textContent = this.localReady ? '✓ Listo' : 'No listo';
    this.el.querySelector('#mp-remote-ready-lbl').textContent = this.remoteReady ? '✓ Listo' : 'No listo';
  }

  _onMessage(msg) {
    if (!msg || !msg.type) return;
    if (msg.type === 'hello' || msg.type === 'skin') {
      this.remoteName = msg.name || 'Rival';
      this.remoteSkin = msg.skin;
      this.el.querySelector('#mp-remote-info').textContent = this.remoteName;
      if (msg.skin) this._preview(this.el.querySelector('#mp-remote-preview'), msg.skin);
      if (msg.ready === false) this.remoteReady = false;
      this._updateReadyLabels();
    }
    if (msg.type === 'ready') {
      this.remoteReady = !!msg.ready;
      if (msg.skin) {
        this.remoteSkin = msg.skin;
        this.remoteName = msg.name || this.remoteName;
        this._preview(this.el.querySelector('#mp-remote-preview'), msg.skin);
      }
      this._updateReadyLabels();
      this._tryStart();
    }
    if (msg.type === 'start') {
      this._beginMatch();
    }
  }

  _tryStart() {
    if (this.localReady && this.remoteReady) {
      // Host decide el arranque
      if (this.session.isHost) {
        this._send({ type: 'start' });
        this._beginMatch();
      }
    }
  }

  async _beginMatch() {
    this._showStep('mp-loading');
    const fill = this.el.querySelector('#mp-load-fill');
    const msg = this.el.querySelector('#mp-loading-msg');
    fill.style.width = '20%';
    msg.textContent = 'Comprobando skins…';

    // Precargar imágenes locales y remotas
    const pieces = ['body', 'weapon', 'projectile', 'trail', 'lamp'];
    const skins = [this.localSkin, this.remoteSkin].filter(Boolean);
    let done = 0;
    const total = Math.max(1, skins.length * pieces.length);
    for (const skin of skins) {
      for (const p of pieces) {
        if (skin[p]) {
          try { await loadImage(skin[p]); } catch (_) {}
        }
        done++;
        fill.style.width = `${Math.round((done / total) * 100)}%`;
      }
    }
    msg.textContent = 'Listo';
    fill.style.width = '100%';
    await new Promise((r) => setTimeout(r, 400));

    this.el.classList.add('hidden');
    this.el.style.display = 'none';
    this.cb.onStartGame?.({
      localSkin: this.localSkin,
      remoteSkin: this.remoteSkin,
      remoteName: this.remoteName,
      isHost: this.session.isHost,
      session: this.session
    });
  }

  async _preview(canvas, tank) {
    if (!canvas || !tank) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#0a0e18';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    try {
      if (tank.body) {
        const img = await loadImage(tank.body);
        const s = canvas.width * 0.5;
        ctx.drawImage(img, (canvas.width - s) / 2, (canvas.height - s) / 2, s, s);
      }
    } catch (_) {}
  }

  _send(obj) {
    this.session.send(obj);
  }
}
