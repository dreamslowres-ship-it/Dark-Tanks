export class MainMenu {
  constructor(onAction) {
    this.el = document.getElementById('main-menu');
    this.onAction = onAction;

    const bind = (id, action) => {
      document.getElementById(id)?.addEventListener('click', () => this.onAction?.(action));
    };
    bind('btn-create-room', 'create-room');
    bind('btn-multiplayer', 'multiplayer');
    bind('btn-depot', 'depot');
    bind('btn-customization', 'customization');
    bind('btn-settings', 'settings');
    // legacy
    bind('btn-join-room', 'multiplayer');
  }

  show() {
    this.el?.classList.remove('hidden');
    if (this.el) this.el.style.display = '';
  }

  hide() {
    this.el?.classList.add('hidden');
    if (this.el) this.el.style.display = 'none';
  }
}
