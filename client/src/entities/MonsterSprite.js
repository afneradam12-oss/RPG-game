import Phaser from 'phaser';

/**
 * Entité Monster — Sprite du monstre avec barre de vie et interactions
 */
export default class MonsterSprite extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, monsterData) {
    super(scene, x, y, texture);

    this.scene = scene;
    this.monsterData = monsterData;
    this.charId = monsterData.id; // Utilisé pour compatibilité avec le ciblage joueur

    // Position "vraie" annoncée par le serveur
    this.targetX = x;
    this.targetY = y;

    // Stats
    this.currentHp = monsterData.hp;
    this.maxHp = monsterData.maxHp;
    this.isDead = monsterData.isDead;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Ajuster taille
    this.setDisplaySize(64, 64);
    this.body.setSize(this.width * 0.6, this.height * 0.6);
    this.body.setOffset(this.width * 0.2, this.height * 0.4);

    this.setBlendMode(Phaser.BlendModes.MULTIPLY);

    // Rendre le sprite cliquable
    this.setInteractive({ useHandCursor: true });

    // Texte du nom
    const prefix = monsterData.name === 'Boss' ? '☠️ ' : '';
    const color = monsterData.name === 'Boss' ? '#ff3333' : '#ffaaaa';
    
    this.nameText = scene.add.text(x, y - 48, prefix + monsterData.name, {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: color,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(10);

    // Barre de vie
    this.createHealthBar();

    // Halo de sélection
    this.selectionCircle = scene.add.graphics();
    this.selectionCircle.setDepth(0);
    this.isSelected = false;

    if (this.isDead) this.setDeadState(true);
  }

  createHealthBar() {
    this.hpBarWidth = 40;
    this.hpBarHeight = 5;

    this.hpBarBg = this.scene.add.graphics();
    this.hpBarBg.setDepth(9);

    this.hpBarFill = this.scene.add.graphics();
    this.hpBarFill.setDepth(9);

    this.drawHealthBar();
  }

  drawHealthBar() {
    if (this.isDead) {
      this.hpBarBg.clear();
      this.hpBarFill.clear();
      return;
    }

    const barX = this.x - this.hpBarWidth / 2;
    const barY = this.y - 38;

    this.hpBarBg.clear();
    this.hpBarBg.fillStyle(0x000000, 0.8);
    this.hpBarBg.fillRoundedRect(barX - 1, barY - 1, this.hpBarWidth + 2, this.hpBarHeight + 2, 2);

    const percent = Math.max(0, this.currentHp / this.maxHp);
    const fillWidth = this.hpBarWidth * percent;

    this.hpBarFill.clear();
    if (fillWidth > 0) {
      this.hpBarFill.fillStyle(0xff3333, 1); // Rouge pour monstres
      this.hpBarFill.fillRoundedRect(barX, barY, fillWidth, this.hpBarHeight, 2);
    }
  }

  updateHealth(hp, maxHp) {
    this.currentHp = hp;
    this.maxHp = maxHp;
  }

  setDeadState(isDead) {
    this.isDead = isDead;
    if (isDead) {
      this.setTint(0x444444);
      this.setAlpha(0.3);
      this.body.enable = false;
      this.hpBarBg.clear();
      this.hpBarFill.clear();
    } else {
      this.clearTint();
      this.setAlpha(1);
      this.body.enable = true;
    }
  }

  setSelected(selected) {
    this.isSelected = selected;
  }

  drawSelection() {
    this.selectionCircle.clear();
    if (this.isSelected && !this.isDead) {
      this.selectionCircle.lineStyle(2, 0xffaa00, 0.8);
      this.selectionCircle.strokeCircle(this.x, this.y + 8, 32);
    }
  }

  setTargetPosition(x, y) {
    if (x < this.targetX) this.setFlipX(true);
    else if (x > this.targetX) this.setFlipX(false);

    const dist = Phaser.Math.Distance.Between(this.x, this.y, x, y);
    if (dist > 150) {
      this.setPosition(x, y);
    }

    this.targetX = x;
    this.targetY = y;
  }

  updateLerp(delta) {
    if (this.isDead) return;

    const lerpFactor = 0.15; // Un peu plus lourd pour les monstres
    
    this.x += (this.targetX - this.x) * lerpFactor;
    this.y += (this.targetY - this.y) * lerpFactor;

    this.nameText.setPosition(this.x, this.y - 48);
    this.drawHealthBar();
    this.drawSelection();
  }

  destroy(fromScene) {
    if (this.nameText) this.nameText.destroy();
    if (this.hpBarBg) this.hpBarBg.destroy();
    if (this.hpBarFill) this.hpBarFill.destroy();
    if (this.selectionCircle) this.selectionCircle.destroy();
    super.destroy(fromScene);
  }
}
