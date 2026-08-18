// Botón reutilizable simple (por si se necesita crear dinámicamente)

export class Button {
  constructor(label, onClick, className = 'btn') {
    this.el = document.createElement('button');
    this.el.className = className;
    this.el.textContent = label;
    this.el.addEventListener('click', onClick);
  }

  mount(parent) {
    parent.appendChild(this.el);
  }

  destroy() {
    this.el.remove();
  }
}
