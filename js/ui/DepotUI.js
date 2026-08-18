// Depósito: lista de tanques guardados con vista previa

import { loadImage } from '../utils/imageLoader.js';
import { sound } from '../audio/SoundManager.js';

export class DepotUI {
  constructor(skinManager, onBack, onEdit, onSelect) {
    this.skinManager = skinManager;
    this.onBack = onBack;
    this.onEdit = onEdit;
    this.onSelect = onSelect;
    this.el = null;
  }

  async open() {
    this._build();
    this.el.classList.remove('hidden');
    this.el.style.display = '';
    await this.refresh();
    try { sound.playUI(); } catch (_) {}
  }

  close() {
    if (this.el) {
      this.el.classList.add('hidden');
      this.el.style.display = 'none';
    }
  }

  _build() {
    if (this.el) return;
    this.el = document.createElement('div');
    this.el.id = 'depot-screen';
    this.el.className = 'screen';
    this.el.innerHTML = `
      <div class="panel depot-panel">
        <h2>Depósito de tanques</h2>
        <p class="muted">Elige un tanque o edítalo. Máx. nombre 16 caracteres.</p>
        <div id="depot-grid" class="depot-grid"></div>
        <div class="row-actions">
          <button class="btn" id="depot-new">+ Nuevo desde actual</button>
          <button class="btn secondary" id="depot-back">Volver</button>
        </div>
      </div>`;
    document.getElementById('ui-overlay').appendChild(this.el);

    this.el.querySelector('#depot-back').onclick = () => {
      this.close();
      this.onBack?.();
    };
    this.el.querySelector('#depot-new').onclick = async () => {
      const skin = this.skinManager.getCurrent();
      const name = prompt('Nombre del tanque:', skin?.tankName || 'Mi Tanque');
      if (name == null) return;
      await this.skinManager.saveToDepot(skin || {}, name);
      await this.refresh();
    };
  }

  async refresh() {
    const grid = this.el.querySelector('#depot-grid');
    grid.innerHTML = '';
    const list = await this.skinManager.list();
    if (!list.length) {
      grid.innerHTML = '<p class="muted">No hay tanques guardados.</p>';
      return;
    }
    for (const tank of list) {
      const card = document.createElement('div');
      card.className = 'depot-card';
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      canvas.className = 'depot-preview';
      this._drawPreview(canvas, tank);
      card.innerHTML = `<div class="depot-name">${escapeHtml(tank.tankName || tank.name || 'Tanque')}</div>`;
      card.prepend(canvas);
      const actions = document.createElement('div');
      actions.className = 'depot-card-actions';
      const useBtn = document.createElement('button');
      useBtn.className = 'btn-sm';
      useBtn.textContent = 'Usar';
      useBtn.onclick = () => {
        this.skinManager.setCurrent(tank);
        this.onSelect?.(tank);
        this.close();
        this.onBack?.();
      };
      const editBtn = document.createElement('button');
      editBtn.className = 'btn-sm';
      editBtn.textContent = 'Editar';
      editBtn.onclick = () => {
        this.skinManager.setCurrent(tank);
        this.close();
        this.onEdit?.(tank);
      };
      const delBtn = document.createElement('button');
      delBtn.className = 'btn-sm';
      delBtn.textContent = 'Borrar';
      delBtn.onclick = async () => {
        if (!confirm('¿Borrar este tanque?')) return;
        await this.skinManager.remove(tank.id);
        await this.refresh();
      };
      actions.append(useBtn, editBtn, delBtn);
      card.appendChild(actions);
      grid.appendChild(card);
    }
  }

  async _drawPreview(canvas, tank) {
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#0a0e18';
    ctx.fillRect(0, 0, 64, 64);
    try {
      if (tank.body) {
        const img = await loadImage(tank.body);
        ctx.drawImage(img, 16, 16, 32, 32);
      } else {
        ctx.fillStyle = '#3d8c4a';
        ctx.fillRect(20, 20, 24, 24);
      }
      if (tank.weapon) {
        const w = await loadImage(tank.weapon);
        ctx.drawImage(w, 16, 16, 32, 32);
      }
    } catch (_) {
      ctx.fillStyle = '#3d8c4a';
      ctx.fillRect(20, 20, 24, 24);
    }
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}
