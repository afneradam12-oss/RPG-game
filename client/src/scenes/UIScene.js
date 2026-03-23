import Phaser from 'phaser';

/**
 * UIScene — HUD (barre de vie, mana, XP, sorts)
 * Rendu par-dessus la GameScene
 */
export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  init(data) {
    this.character = data.character;
  }

  create() {
    // ── Fond du HUD (bande supérieure) ──
    const hudBg = this.add.graphics();
    hudBg.fillStyle(0x000000, 0.6);
    hudBg.fillRect(0, 0, 1024, 50);

    // ── Nom + Classe + Niveau ──
    this.add.text(12, 8, `${this.character.name}`, {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#e8d5b7',
      fontStyle: 'bold',
    });

    this.add.text(12, 28, `${this.character.className.toUpperCase()} — Niv. ${this.character.level}`, {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#8888aa',
    });

    // ── Barre de vie ──
    const hpX = 200;
    const barWidth = 180;
    const barHeight = 14;

    this.add.text(hpX, 6, '❤️ HP', {
      fontFamily: 'Arial', fontSize: '11px', color: '#ff6b6b',
    });

    // Fond
    this.add.graphics()
      .fillStyle(0x333333, 1)
      .fillRoundedRect(hpX, 22, barWidth, barHeight, 4);

    // Barre
    const hpPercent = (this.character.stats?.hp || 100) / (this.character.stats?.maxHp || 100);
    this.hpBar = this.add.graphics()
      .fillStyle(0xe74c3c, 1)
      .fillRoundedRect(hpX, 22, barWidth * hpPercent, barHeight, 4);

    this.hpText = this.add.text(hpX + barWidth / 2, 22 + barHeight / 2,
      `${this.character.stats?.hp || 100} / ${this.character.stats?.maxHp || 100}`, {
        fontFamily: 'Arial', fontSize: '10px', color: '#ffffff',
      }).setOrigin(0.5);

    // ── Barre de mana ──
    const manaX = 410;

    this.add.text(manaX, 6, '💧 Mana', {
      fontFamily: 'Arial', fontSize: '11px', color: '#74b9ff',
    });

    this.add.graphics()
      .fillStyle(0x333333, 1)
      .fillRoundedRect(manaX, 22, barWidth, barHeight, 4);

    const manaPercent = (this.character.stats?.mana || 50) / (this.character.stats?.maxMana || 50);
    this.manaBar = this.add.graphics()
      .fillStyle(0x3498db, 1)
      .fillRoundedRect(manaX, 22, barWidth * manaPercent, barHeight, 4);

    this.manaText = this.add.text(manaX + barWidth / 2, 22 + barHeight / 2,
      `${this.character.stats?.mana || 50} / ${this.character.stats?.maxMana || 50}`, {
        fontFamily: 'Arial', fontSize: '10px', color: '#ffffff',
      }).setOrigin(0.5);

    // ── Barre XP ──
    const xpX = 620;
    this.add.text(xpX, 6, '⭐ XP', {
      fontFamily: 'Arial', fontSize: '11px', color: '#ffd700',
    });

    this.add.graphics()
      .fillStyle(0x333333, 1)
      .fillRoundedRect(xpX, 22, barWidth, barHeight, 4);

    this.xpBar = this.add.graphics()
      .fillStyle(0xf39c12, 1)
      .fillRoundedRect(xpX, 22, 0, barHeight, 4);

    this.xpText = this.add.text(xpX + barWidth / 2, 22 + barHeight / 2,
      `${this.character.xp || 0} XP`, {
        fontFamily: 'Arial', fontSize: '10px', color: '#ffffff',
      }).setOrigin(0.5);

    // ── Barre de sorts (bas de l'écran) ──
    this.createSpellBar();
  }

  createSpellBar() {
    const y = 720;
    const spellSize = 48;
    const gap = 10;
    const totalWidth = 4 * spellSize + 3 * gap;
    const startX = (1024 - totalWidth) / 2;

    // Fond
    const spellBg = this.add.graphics();
    spellBg.fillStyle(0x000000, 0.7);
    spellBg.fillRoundedRect(startX - 15, y - 10, totalWidth + 30, spellSize + 20, 8);

    const spellKeys = ['1', '2', '3', '4'];
    const spellColors = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf39c12];
    const spellNames = ['Sort 1', 'Sort 2', 'Sort 3', 'Sort 4'];

    for (let i = 0; i < 4; i++) {
      const x = startX + i * (spellSize + gap);

      // Icône du sort (placeholder)
      const icon = this.add.graphics();
      icon.fillStyle(spellColors[i], 0.6);
      icon.fillRoundedRect(x, y, spellSize, spellSize, 6);
      icon.lineStyle(1, 0xffffff, 0.3);
      icon.strokeRoundedRect(x, y, spellSize, spellSize, 6);

      // Nom du sort
      this.add.text(x + spellSize / 2, y + spellSize / 2, spellNames[i], {
        fontFamily: 'Arial', fontSize: '10px', color: '#ffffff',
      }).setOrigin(0.5);

      // Touche de raccourci
      this.add.text(x + spellSize - 4, y + 4, spellKeys[i], {
        fontFamily: 'Arial', fontSize: '10px', color: '#ffdd57',
        fontStyle: 'bold',
      }).setOrigin(1, 0);
    }
  }
}
