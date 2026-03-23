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

    // ── Génération de textures placeholder ──
    // (Seront remplacées par les sprites IA plus tard)
    this.createPlaceholderTextures();
  }

  create() {
    // Passer à la scène de login
    this.scene.start('LoginScene');
  }

  /**
   * Crée des textures placeholder pour le développement
   * Ces textures seront remplacées par les vrais sprites plus tard
   */
  createPlaceholderTextures() {
    // Joueur (carré bleu)
    const playerGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    playerGraphics.fillStyle(0x6c5ce7, 1);
    playerGraphics.fillRoundedRect(0, 0, 32, 32, 4);
    playerGraphics.generateTexture('player_placeholder', 32, 32);
    playerGraphics.destroy();

    // Autre joueur (carré vert)
    const otherGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    otherGraphics.fillStyle(0x00b894, 1);
    otherGraphics.fillRoundedRect(0, 0, 32, 32, 4);
    otherGraphics.generateTexture('other_player_placeholder', 32, 32);
    otherGraphics.destroy();

    // Monstre (carré rouge)
    const monsterGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    monsterGraphics.fillStyle(0xe17055, 1);
    monsterGraphics.fillRoundedRect(0, 0, 32, 32, 4);
    monsterGraphics.generateTexture('monster_placeholder', 32, 32);
    monsterGraphics.destroy();

    // Tile sol (herbe)
    const grassGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    grassGraphics.fillStyle(0x2d5a27, 1);
    grassGraphics.fillRect(0, 0, 32, 32);
    grassGraphics.fillStyle(0x3a7a32, 0.5);
    grassGraphics.fillRect(4, 4, 8, 8);
    grassGraphics.fillRect(20, 12, 6, 6);
    grassGraphics.fillRect(8, 20, 10, 6);
    grassGraphics.generateTexture('tile_grass', 32, 32);
    grassGraphics.destroy();
  }
}
