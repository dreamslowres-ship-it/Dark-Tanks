// Indicadores en partida

export class HUD {
  constructor() {
    this.el = document.getElementById('hud');
    this.healthFill = document.getElementById('health-fill');
    this.ammoDisplay = document.getElementById('ammo-display');
    this.scoreEl = document.getElementById('score-display');
    this.killsEl = document.getElementById('kills-display');
    this.statusEl = document.getElementById('status-display');
  }

  show() {
    this.el?.classList.remove('hidden');
  }

  hide() {
    this.el?.classList.add('hidden');
  }

  update(stats) {
    if (this.healthFill) {
      const pct = Math.max(0, Math.min(100, (stats.health / stats.maxHealth) * 100));
      this.healthFill.style.width = `${pct}%`;
      this.healthFill.style.background = pct > 40
        ? 'linear-gradient(90deg, #2a8a2a, #4c4)'
        : 'linear-gradient(90deg, #8a2a2a, #c44)';
    }
    if (this.scoreEl) this.scoreEl.textContent = `Score: ${stats.score}`;
    if (this.killsEl) this.killsEl.textContent = `Kills: ${stats.kills}`;
    if (this.statusEl) {
      this.statusEl.textContent = stats.alive ? '' : 'RESPAWN...';
      this.statusEl.style.opacity = stats.alive ? '0' : '1';
    }
  }
}
