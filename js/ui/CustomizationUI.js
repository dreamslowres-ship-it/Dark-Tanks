// UI completa de personalización de skins

import { loadAndValidateImage, imageToBase64, loadImage } from '../utils/imageLoader.js';
import { packSkin } from '../customization/SkinPacker.js';
import { unpackSkin } from '../customization/SkinUnpacker.js';
import { generateTemplate } from '../customization/SkinTemplate.js';
import { createDefaultSkin } from '../utils/DefaultAssets.js';
import { sound } from '../audio/SoundManager.js';

const PIECES = [
  { key: 'body', label: 'Cuerpo', desc: 'Base del vehículo' },
  { key: 'weapon', label: 'Arma', desc: 'Cañón (centro = pivote)' },
  { key: 'projectile', label: 'Proyectil', desc: 'Bala / misil' },
  { key: 'trail', label: 'Rastro', desc: 'Huella en el suelo' },
  { key: 'lamp', label: 'Farol', desc: 'Lámpara frontal' }
];

export class CustomizationUI {
  constructor(skinManager, onBack, onApply) {
    this.skinManager = skinManager;
    this.onBack = onBack;
    this.onApply = onApply;
    this.el = null;
    this.previewCanvas = null;
    this.previewAngle = 0;
    this._raf = null;
  }

  open() {
    this._build();
    this.el.classList.remove('hidden');
    this.el.style.display = '';
    this._startPreview();
    try { sound.playUI(); } catch (_) {}
  }

  close() {
    try { this._stopPreview(); } catch (_) {}
    if (this.el) {
      this.el.classList.add('hidden');
      this.el.style.display = 'none';
    }
  }

  _build() {
    if (this.el) {
      this._refreshThumbs();
      return;
    }

    this.el = document.createElement('div');
    this.el.id = 'customization-screen';
    this.el.className = 'screen';
    this.el.innerHTML = `
      <div class="custom-panel">
        <div class="custom-header">
          <h2>Personalizar Tanque</h2>
          <p class="custom-hint">Ideal <strong>32×32 px</strong> PNG (si es otro tamaño se reescala automáticamente)</p>
          <label class="name-label">Nombre del tanque
            <input id="tank-name-input" class="text-input" maxlength="16" placeholder="Mi Tanque" />
          </label>
        </div>

        <div class="custom-body">
          <div class="custom-preview-wrap">
            <canvas id="skin-preview" width="160" height="160"></canvas>
            <p class="preview-label">Vista previa</p>
          </div>

          <div class="custom-pieces" id="pieces-grid"></div>
        </div>

        <div class="custom-actions">
          <button class="btn" id="btn-import-pack">Importar Skin (PNG pack)</button>
          <button class="btn secondary" id="btn-export-pack">Exportar Skin</button>
          <button class="btn secondary" id="btn-download-template">Plantilla</button>
          <button class="btn secondary" id="btn-reset-skin">Restablecer</button>
        </div>

        <div class="custom-footer">
          <button class="btn" id="btn-apply-skin">Usar esta skin</button>
          <button class="btn secondary" id="btn-back-custom">Volver</button>
        </div>
      </div>
    `;
    document.getElementById('ui-overlay').appendChild(this.el);

    this.previewCanvas = this.el.querySelector('#skin-preview');

    // Grid de piezas
    const grid = this.el.querySelector('#pieces-grid');
    for (const p of PIECES) {
      const card = document.createElement('div');
      card.className = 'piece-card';
      card.dataset.piece = p.key;
      card.innerHTML = `
        <div class="piece-thumb" id="thumb-${p.key}"></div>
        <div class="piece-info">
          <strong>${p.label}</strong>
          <span>${p.desc}</span>
        </div>
        <button class="btn-sm" data-import="${p.key}">Importar</button>
      `;
      grid.appendChild(card);
    }

    // Eventos import individual
    grid.querySelectorAll('[data-import]').forEach(btn => {
      btn.addEventListener('click', () => this._importPiece(btn.dataset.import));
    });

    this.el.querySelector('#btn-import-pack').addEventListener('click', () => this._importPack());
    this.el.querySelector('#btn-export-pack').addEventListener('click', () => this._exportPack());
    this.el.querySelector('#btn-download-template').addEventListener('click', () => this._downloadTemplate());
    this.el.querySelector('#btn-reset-skin').addEventListener('click', () => {
      this.skinManager.currentSkin = createDefaultSkin('#3d8c4a');
      this._refreshThumbs();
      sound.playUI();
    });
    this.el.querySelector('#btn-apply-skin').addEventListener('click', async () => {
      try { sound.playReady(); } catch (_) {}
      const nameInput = this.el.querySelector('#tank-name-input');
      if (nameInput?.value) this.skinManager.setTankName(nameInput.value);
      const skin = this.skinManager.getCurrent();
      try {
        await this.skinManager.saveToDepot(skin, skin?.tankName || skin?.name);
      } catch (_) {}
      this.onApply?.(skin);
      this.close();
      this.onBack?.();
    });
    this.el.querySelector('#btn-back-custom').addEventListener('click', () => {
      this.close();
      this.onBack?.();
    });

    this._refreshThumbs();
    const nameInput = this.el.querySelector('#tank-name-input');
    if (nameInput) {
      const cur = this.skinManager.getCurrent();
      nameInput.value = cur?.tankName || cur?.name || '';
      nameInput.onchange = () => this.skinManager.setTankName(nameInput.value);
      nameInput.oninput = () => this.skinManager.setTankName(nameInput.value);
    }
  }

  _refreshThumbs() {
    const skin = this.skinManager.getCurrent() || {};
    for (const p of PIECES) {
      const thumb = this.el?.querySelector(`#thumb-${p.key}`);
      if (!thumb) continue;
      thumb.innerHTML = '';
      if (skin[p.key]) {
        const img = document.createElement('img');
        img.src = skin[p.key];
        img.alt = p.key;
        thumb.appendChild(img);
      } else {
        thumb.textContent = '—';
      }
    }
  }

  async _importPiece(pieceKey) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/gif,image/webp';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        await this.skinManager.importPiece(file, pieceKey);
        this._refreshThumbs();
        sound.playUI();
        this._flash(`✓ ${pieceKey} importado`);
      } catch (e) {
        this._flash(e.message || 'Error al importar', true);
      }
    };
    input.click();
  }

  async _importPack() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const pieces = await unpackSkin(file);
        const skin = this.skinManager.getCurrent() || createDefaultSkin();
        Object.assign(skin, pieces);
        this.skinManager.currentSkin = skin;
        this._refreshThumbs();
        sound.playReady();
        this._flash('✓ Skin importada');
      } catch (e) {
        this._flash(e.message || 'Error al importar pack', true);
      }
    };
    input.click();
  }

  async _exportPack() {
    try {
      const skin = this.skinManager.getCurrent();
      const blob = await packSkin(skin);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nighttanks-skin-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
      sound.playUI();
      this._flash('✓ Skin exportada');
    } catch (e) {
      this._flash('Error al exportar', true);
    }
  }

  async _downloadTemplate() {
    const blob = await generateTemplate();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nighttanks-template.png';
    a.click();
    URL.revokeObjectURL(url);
    sound.playUI();
  }

  _flash(msg, isError = false) {
    let el = this.el.querySelector('.custom-flash');
    if (!el) {
      el = document.createElement('div');
      el.className = 'custom-flash';
      this.el.querySelector('.custom-panel').appendChild(el);
    }
    el.textContent = msg;
    el.classList.toggle('error', isError);
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2200);
  }

  _startPreview() {
    const canvas = this.previewCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const skin = () => this.skinManager.getCurrent() || {};

    const imgs = {};
    const load = async () => {
      for (const k of ['body', 'weapon', 'lamp']) {
        if (skin()[k]) {
          try { imgs[k] = await loadImage(skin()[k]); } catch (_) { imgs[k] = null; }
        } else imgs[k] = null;
      }
    };
    load();

    // Recargar thumbs periódicamente cuando cambian
    this._previewLoadTimer = setInterval(load, 800);

    const draw = () => {
      this.previewAngle += 0.012;
      ctx.clearRect(0, 0, 160, 160);

      // Fondo
      ctx.fillStyle = '#0a0e18';
      ctx.fillRect(0, 0, 160, 160);
      // Grid
      ctx.strokeStyle = 'rgba(60,80,120,0.25)';
      for (let i = 0; i < 160; i += 16) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 160); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(160, i); ctx.stroke();
      }

      ctx.save();
      ctx.translate(80, 80);
      ctx.rotate(this.previewAngle);

      if (imgs.body) ctx.drawImage(imgs.body, -32, -32, 64, 64);
      else {
        ctx.fillStyle = '#3d8c4a';
        ctx.fillRect(-28, -24, 56, 48);
      }

      // Farol frontal
      if (imgs.lamp) ctx.drawImage(imgs.lamp, 12, -16, 32, 32);
      else {
        ctx.fillStyle = '#ffe066';
        ctx.beginPath();
        ctx.arc(22, 0, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Arma
      ctx.rotate(Math.sin(this.previewAngle * 2) * 0.3);
      if (imgs.weapon) ctx.drawImage(imgs.weapon, -32, -32, 64, 64);
      else {
        ctx.fillStyle = '#6a6a70';
        ctx.fillRect(0, -5, 30, 10);
      }

      ctx.restore();
      this._raf = requestAnimationFrame(draw);
    };
    this._raf = requestAnimationFrame(draw);
  }

  _stopPreview() {
    if (this._raf) cancelAnimationFrame(this._raf);
    if (this._previewLoadTimer) clearInterval(this._previewLoadTimer);
  }
}
