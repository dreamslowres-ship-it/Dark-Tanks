// Night Tanks — Offline vs IA + Multijugador 2P (sin IA)

import { GameEngine } from './game/GameEngine.js';
import { InputManager } from './input/InputManager.js';
import { KeyboardMouse } from './input/KeyboardMouse.js';
import { MainMenu } from './ui/MainMenu.js';
import { HUD } from './ui/HUD.js';
import { CustomizationUI } from './ui/CustomizationUI.js';
import { DepotUI } from './ui/DepotUI.js';
import { MultiplayerUI } from './ui/MultiplayerUI.js';
import { MultiplayerSession } from './networking/MultiplayerSession.js';
import { SkinManager } from './customization/SkinManager.js';
import { createDefaultSkin } from './utils/DefaultAssets.js';
import { sound } from './audio/SoundManager.js';
import { getSetting, setSetting } from './utils/storage.js';

class App {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.engine = null;
    this.input = new InputManager();
    this.kbMouse = null;
    this.skinManager = new SkinManager();
    this.hud = new HUD();
    this.customUI = null;
    this.depotUI = null;
    this.mpUI = null;
    this.session = new MultiplayerSession();
    this.state = 'menu';
    this._rafInput = null;
    this.savedZoom = 2.25;
  }

  async init() {
    await this.skinManager.init();
    const saved = getSetting('zoom', 2.25);
    this.savedZoom = typeof saved === 'number' ? saved : 2.25;

    this.input.init();
    this.kbMouse = new KeyboardMouse(this.canvas);

    this.mainMenu = new MainMenu((action) => this.handleMenuAction(action));

    this.customUI = new CustomizationUI(
      this.skinManager,
      () => {
        this.state = 'menu';
        this.mainMenu.show();
      },
      async (skin) => {
        if (skin) {
          this.skinManager.setCurrent(skin);
          // Guardar en depósito si tiene nombre
          const name = skin.tankName || skin.name;
          if (name) await this.skinManager.saveToDepot(skin, name);
        }
      }
    );

    this.depotUI = new DepotUI(
      this.skinManager,
      () => {
        this.state = 'menu';
        this.mainMenu.show();
      },
      (tank) => {
        this.skinManager.setCurrent(tank);
        this.state = 'custom';
        this.customUI.open();
      },
      (tank) => {
        this.skinManager.setCurrent(tank);
      }
    );

    this.mpUI = new MultiplayerUI(this.skinManager, this.session, {
      onBack: () => {
        this.state = 'menu';
        this.mainMenu.show();
      },
      onStartGame: (info) => this.startMultiplayerGame(info)
    });

    document.getElementById('btn-exit-game')?.addEventListener('click', () => {
      try { sound.playUI(); } catch (_) {}
      this.exitToMenu();
    });

    // Zoom in-game
    document.getElementById('btn-zoom-in')?.addEventListener('click', () => {
      if (this.engine) {
        this.engine.adjustZoom(0.15);
        this.savedZoom = this.engine.zoom;
        setSetting('zoom', this.savedZoom);
        this._updateZoomLabel();
      }
    });
    document.getElementById('btn-zoom-out')?.addEventListener('click', () => {
      if (this.engine) {
        this.engine.adjustZoom(-0.15);
        this.savedZoom = this.engine.zoom;
        setSetting('zoom', this.savedZoom);
        this._updateZoomLabel();
      }
    });

    document.getElementById('lobby')?.classList.add('hidden');
    this.mainMenu.show();
    this.hud.hide();
    this._hideJoysticks();
    document.getElementById('btn-exit-game')?.classList.add('hidden');
    document.getElementById('zoom-controls')?.classList.add('hidden');

    console.log('%cNight Tanks listo (offline + MP)', 'color:#5af;font-weight:bold');
  }

  handleMenuAction(action) {
    try { sound.playUI(); } catch (_) {}

    switch (action) {
      case 'create-room': // Jugar vs IA
        this.startLocalGame();
        break;
      case 'join-room':
      case 'multiplayer':
        this.mainMenu.hide();
        this.state = 'mp';
        this.mpUI.open();
        break;
      case 'depot':
        this.mainMenu.hide();
        this.state = 'depot';
        this.depotUI.open();
        break;
      case 'customization':
        this.mainMenu.hide();
        this.state = 'custom';
        this.customUI.open();
        break;
      case 'settings':
        this._openSettings();
        break;
    }
  }

  _openSettings() {
    const z = this.savedZoom.toFixed(2);
    const snd = sound.enabled ? 'ON' : 'OFF';
    const choice = prompt(
      `Ajustes\n\n1 = Sonido (${snd})\n2 = Zoom actual (${z}) — también +/- en partida\n\nEscribe 1 o 2:`,
      '1'
    );
    if (choice === '1') {
      sound.enabled = !sound.enabled;
      alert('Sonido: ' + (sound.enabled ? 'ON' : 'OFF'));
    } else if (choice === '2') {
      const v = parseFloat(prompt('Zoom (1.4 – 3.5):', String(this.savedZoom)));
      if (!Number.isNaN(v)) {
        this.savedZoom = Math.max(1.4, Math.min(3.5, v));
        setSetting('zoom', this.savedZoom);
        alert('Zoom guardado: ' + this.savedZoom.toFixed(2));
      }
    }
  }

  startLocalGame() {
    this._beginPlay({ multiplayer: false });
  }

  startMultiplayerGame(info) {
    this._beginPlay({
      multiplayer: true,
      session: info.session,
      isHost: info.isHost,
      localSkin: info.localSkin,
      remoteSkin: info.remoteSkin,
      remoteName: info.remoteName
    });
  }

  _beginPlay(opts) {
    this.mainMenu.hide();
    this.customUI?.close();
    this.depotUI?.close();
    // mpUI ya se ocultó al empezar

    this.hud.show();
    this._showJoysticks();
    document.getElementById('btn-exit-game')?.classList.remove('hidden');
    document.getElementById('zoom-controls')?.classList.remove('hidden');
    this.state = 'playing';

    try { sound.playReady(); } catch (_) {}
    if (this.engine) this.engine.stop();

    this.engine = new GameEngine(this.canvas);
    this.engine.setZoom(this.savedZoom);
    this.engine.onKill = () => { try { sound.playExplosion(); } catch (_) {} };
    this.engine.onDeath = () => { try { sound.playHit(); } catch (_) {} };
    this.engine.onShoot = () => { try { sound.playShoot(); } catch (_) {} };

    const skin = opts.localSkin || this.skinManager.getCurrent() || createDefaultSkin();
    this.engine.start(skin, {
      multiplayer: !!opts.multiplayer,
      session: opts.session || null,
      isHost: opts.isHost !== false,
      remoteSkin: opts.remoteSkin || null,
      remoteName: opts.remoteName || 'Rival'
    });
    this._updateZoomLabel();

    const updateLoop = () => {
      if (this.state !== 'playing') return;

      let inputState = this.input.update();

      if (this.kbMouse && this.engine?.localTank) {
        const kb = this.kbMouse.getState(
          this.engine.camera,
          this.engine.localTank,
          this.engine.zoom || 1
        );
        if (Math.abs(kb.moveX) > 0.1 || Math.abs(kb.moveY) > 0.1) {
          inputState.moveX = kb.moveX;
          inputState.moveY = kb.moveY;
        }
        if (kb.hasAim) {
          inputState.aimX = kb.aimX;
          inputState.aimY = kb.aimY;
          inputState.hasAim = true;
          if (kb.shooting) inputState.shooting = true;
        }
        // Zoom teclas + / -
        if (this.kbMouse.keys['Equal'] || this.kbMouse.keys['NumpadAdd']) {
          this.engine.adjustZoom(0.02);
          this.savedZoom = this.engine.zoom;
        }
        if (this.kbMouse.keys['Minus'] || this.kbMouse.keys['NumpadSubtract']) {
          this.engine.adjustZoom(-0.02);
          this.savedZoom = this.engine.zoom;
        }
      }

      this.engine.setInput(inputState);
      this.hud.update(this.engine.getStats());
      this._updateZoomLabel();
      this._rafInput = requestAnimationFrame(updateLoop);
    };
    this._rafInput = requestAnimationFrame(updateLoop);
  }

  _updateZoomLabel() {
    const el = document.getElementById('zoom-label');
    if (el && this.engine) el.textContent = this.engine.zoom.toFixed(1) + 'x';
  }

  exitToMenu() {
    this.state = 'menu';
    if (this.engine) {
      this.engine.stop();
      this.engine = null;
    }
    try { this.session.close(); } catch (_) {}
    if (this._rafInput) cancelAnimationFrame(this._rafInput);
    setSetting('zoom', this.savedZoom);

    this.hud.hide();
    this._hideJoysticks();
    document.getElementById('btn-exit-game')?.classList.add('hidden');
    document.getElementById('zoom-controls')?.classList.add('hidden');
    this.mpUI?.close();
    this.mainMenu.show();
  }

  _showJoysticks() {
    const l = document.getElementById('joystick-left');
    const r = document.getElementById('joystick-right');
    if (l) l.style.display = 'block';
    if (r) r.style.display = 'block';
  }

  _hideJoysticks() {
    const l = document.getElementById('joystick-left');
    const r = document.getElementById('joystick-right');
    if (l) l.style.display = 'none';
    if (r) r.style.display = 'none';
  }
}

const app = new App();
app.init().catch((e) => {
  console.error(e);
  alert('Error al iniciar: ' + e.message);
});
