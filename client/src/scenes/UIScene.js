import Phaser from 'phaser';
import { CLASS_SPELLS } from '../../../shared/data/spells.js';

/**
 * UIScene — HUD dynamique (barre de vie, mana, XP, sorts avec cooldowns)
 * Rendu par-dessus la GameScene. Se met à jour en temps réel via updateHUD().
 */
export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  init(data) {
    this.character = data.character;
  }

  create() {
    const stats = this.character.stats || {};
    this.currentHp = stats.hp || 100;
    this.maxHpVal = stats.maxHp || 100;
    this.currentMana = stats.mana || 50;
    this.maxManaVal = stats.maxMana || 50;

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

    // Barre HP (dynamique)
    this.hpBar = this.add.graphics();
    this.hpText = this.add.text(hpX + barWidth / 2, 22 + barHeight / 2,
      `${this.currentHp} / ${this.maxHpVal}`, {
        fontFamily: 'Arial', fontSize: '10px', color: '#ffffff',
      }).setOrigin(0.5);

    this.hpBarX = hpX;
    this.hpBarWidth = barWidth;
    this.hpBarHeight = barHeight;
    this.drawHpBar();

    // ── Barre de mana ──
    const manaX = 410;

    this.add.text(manaX, 6, '💧 Mana', {
      fontFamily: 'Arial', fontSize: '11px', color: '#74b9ff',
    });

    this.add.graphics()
      .fillStyle(0x333333, 1)
      .fillRoundedRect(manaX, 22, barWidth, barHeight, 4);

    this.manaBar = this.add.graphics();
    this.manaText = this.add.text(manaX + barWidth / 2, 22 + barHeight / 2,
      `${this.currentMana} / ${this.maxManaVal}`, {
        fontFamily: 'Arial', fontSize: '10px', color: '#ffffff',
      }).setOrigin(0.5);

    this.manaBarX = manaX;
    this.drawManaBar();

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

    // ── Barre de sorts ──
    this.createSpellBar();
  }

  drawHpBar() {
    const percent = Math.max(0, this.currentHp / this.maxHpVal);
    const fillWidth = this.hpBarWidth * percent;

    this.hpBar.clear();
    if (fillWidth > 0) {
      // Couleur dynamique
      let color;
      if (percent > 0.6) color = 0xe74c3c;
      else if (percent > 0.3) color = 0xf39c12;
      else color = 0xc0392b;

      this.hpBar.fillStyle(color, 1);
      this.hpBar.fillRoundedRect(this.hpBarX, 22, fillWidth, this.hpBarHeight, 4);
    }

    this.hpText.setText(`${Math.round(this.currentHp)} / ${this.maxHpVal}`);
  }

  drawManaBar() {
    const percent = Math.max(0, this.currentMana / this.maxManaVal);
    const fillWidth = this.hpBarWidth * percent;

    this.manaBar.clear();
    if (fillWidth > 0) {
      this.manaBar.fillStyle(0x3498db, 1);
      this.manaBar.fillRoundedRect(this.manaBarX, 22, fillWidth, this.hpBarHeight, 4);
    }

    this.manaText.setText(`${Math.round(this.currentMana)} / ${this.maxManaVal}`);
  }

  /**
   * Appelé par GameScene à chaque GAME_STATE pour mettre à jour le HUD
   */
  updateHUD(hp, maxHp, mana, maxMana) {
    this.currentHp = hp;
    this.maxHpVal = maxHp;
    this.currentMana = mana;
    this.maxManaVal = maxMana;

    this.drawHpBar();
    this.drawManaBar();
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

    // Charger les vrais sorts de la classe
    const className = this.character.className.toLowerCase();
    const spells = CLASS_SPELLS[className] || [];
    const spellKeys = ['1', '2', '3', '4'];
    const defaultColors = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf39c12];

    for (let i = 0; i < 4; i++) {
      const x = startX + i * (spellSize + gap);
      const spell = spells[i];

      // Icône du sort
      const icon = this.add.graphics();
      icon.fillStyle(defaultColors[i], 0.6);
      icon.fillRoundedRect(x, y, spellSize, spellSize, 6);
      icon.lineStyle(1, 0xffffff, 0.3);
      icon.strokeRoundedRect(x, y, spellSize, spellSize, 6);

      // Emoji du sort
      const iconText = spell ? spell.icon : '❓';
      this.add.text(x + spellSize / 2, y + 14, iconText, {
        fontFamily: 'Arial', fontSize: '18px',
      }).setOrigin(0.5);

      // Nom du sort
      const spellName = spell ? spell.name : `Sort ${i + 1}`;
      // Tronquer si trop long
      const displayName = spellName.length > 10 ? spellName.substring(0, 9) + '.' : spellName;
      this.add.text(x + spellSize / 2, y + spellSize - 8, displayName, {
        fontFamily: 'Arial', fontSize: '8px', color: '#dddddd',
      }).setOrigin(0.5);

      // Touche de raccourci
      this.add.text(x + spellSize - 4, y + 4, spellKeys[i], {
        fontFamily: 'Arial', fontSize: '10px', color: '#ffdd57',
        fontStyle: 'bold',
      }).setOrigin(1, 0);

      // Coût mana
      if (spell) {
        this.add.text(x + 4, y + 4, `${spell.manaCost}💧`, {
          fontFamily: 'Arial', fontSize: '8px', color: '#74b9ff',
        });
      }
    }
  }
}
