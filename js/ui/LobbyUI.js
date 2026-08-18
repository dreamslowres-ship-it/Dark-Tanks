// UI de la sala de espera

export class LobbyUI {
  constructor(onAction) {
    this.el = document.getElementById('lobby');
    this.playerList = document.getElementById('player-list');
    this.countdownEl = document.getElementById('countdown');
    this.onAction = onAction;

    document.getElementById('btn-ready')?.addEventListener('click', () => {
      this.onAction?.('ready');
    });
    document.getElementById('btn-leave')?.addEventListener('click', () => {
      this.onAction?.('leave');
    });
  }

  show() {
    this.el?.classList.remove('hidden');
  }

  hide() {
    this.el?.classList.add('hidden');
  }

  updatePlayers(players) {
    if (!this.playerList) return;
    this.playerList.innerHTML = players.map(p =>
      `<div>${p.name} ${p.ready ? '✓' : '…'}</div>`
    ).join('');
  }

  showCountdown(seconds) {
    if (!this.countdownEl) return;
    this.countdownEl.classList.remove('hidden');
    this.countdownEl.textContent = seconds;
  }

  hideCountdown() {
    this.countdownEl?.classList.add('hidden');
  }
}
