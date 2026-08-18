// Depósito de tanques: guardar, listar, nombres, skin activa

import { saveSkin, loadSkin, getAllSkins, deleteSkin } from '../utils/storage.js';
import { loadAndValidateImage, imageToBase64 } from '../utils/imageLoader.js';
import { createDefaultSkin } from '../utils/DefaultAssets.js';

export class SkinManager {
  constructor() {
    this.currentSkin = null;
    this.depot = []; // lista en memoria
  }

  async init() {
    this.depot = await getAllSkins();
    if (!this.depot.length) {
      const def = createDefaultSkin('#3d8c4a');
      def.id = 'tank_default';
      def.name = 'Tanque Básico';
      def.tankName = 'Tanque Básico';
      await saveSkin(def);
      this.depot = [def];
    }
    this.currentSkin = { ...this.depot[0] };
    return this.depot;
  }

  getCurrent() {
    return this.currentSkin;
  }

  setCurrent(skin) {
    this.currentSkin = skin ? { ...skin } : this.currentSkin;
  }

  async list() {
    this.depot = await getAllSkins();
    return this.depot;
  }

  async saveToDepot(skin, name) {
    const id = skin.id && String(skin.id).startsWith('tank_')
      ? skin.id
      : `tank_${Date.now()}`;
    const entry = {
      ...skin,
      id,
      name: name || skin.tankName || skin.name || 'Sin nombre',
      tankName: name || skin.tankName || skin.name || 'Sin nombre',
      updatedAt: Date.now()
    };
    await saveSkin(entry);
    this.currentSkin = entry;
    await this.list();
    return entry;
  }

  async remove(id) {
    await deleteSkin(id);
    await this.list();
    if (this.currentSkin?.id === id) {
      this.currentSkin = this.depot[0] ? { ...this.depot[0] } : createDefaultSkin();
    }
  }

  async importPiece(file, pieceType) {
    const img = await loadAndValidateImage(file, true);
    const base64 = imageToBase64(img);
    if (!this.currentSkin) this.currentSkin = createDefaultSkin();
    this.currentSkin = { ...this.currentSkin, [pieceType]: base64 };
    return base64;
  }

  setTankName(name) {
    if (!this.currentSkin) this.currentSkin = createDefaultSkin();
    const n = (name || 'Sin nombre').trim().slice(0, 16);
    this.currentSkin.name = n;
    this.currentSkin.tankName = n;
  }
}
