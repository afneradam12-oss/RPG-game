import Phaser from 'phaser';

/**
 * BootScene — Chargement des assets et initialisation
 * Première scène lancée au démarrage
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // ── Barre de chargement ──
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222244, 0.8);
    progressBox.fillRoundedRect(width / 2 - 160, height / 2 - 15, 320, 30, 8);

    const loadingText = this.add.text(width / 2, height / 2 - 40, 'Chargement...', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#e0e0ff',
    }).setOrigin(0.5);

    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(0x6c5ce7, 1);
      progressBar.fillRoundedRect(width / 2 - 155, height / 2 - 10, 310 * value, 20, 6);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    // ── Chargement des vrais assets (Générés par IA) ──
    this.load.image('hero', '/assets/sprites/characters/hero.png');
    this.load.image('tiles_grass', '/assets/tilesets/grass.png');
  }

  create() {
    // Passer à la scène de login
    this.scene.start('LoginScene');
  }
}
