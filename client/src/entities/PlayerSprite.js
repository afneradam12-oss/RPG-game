import Phaser from 'phaser';

/**
 * Entité Player — Sprite du joueur avec barre de vie et interactions combat.
 * Mode "Dumb Client" : s'interpole vers la position dictée par le serveur.
 */
export default class PlayerSprite extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, characterData) {
    super(scene, x, y, texture);

    this.scene = scene;
    this.characterData = characterData;
    this.charId = characterData.id || characterData._id;

    // Position "vraie" annoncée par le serveur
    this.targetX = x;
    this.targetY = y;

    // Stats de combat
    this.currentHp = characterData.hp || characterData.stats?.hp || 100;
    this.maxHp = characterData.maxHp || characterData.stats?.maxHp || 100;
    this.currentMana = characterData.mana || characterData.stats?.mana || 50;
    this.maxMana = characterData.maxMana || characterData.stats?.maxMana || 50;
    this.playerIsDead = false;

    // Ajouter l'objet à la scène
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Collider du monde
    this.setCollideWorldBounds(true);
    
    // Adapter la taille
    this.setDisplaySize(64, 64);
    this.body.setSize(this.width * 0.5, this.height * 0.8);
    this.body.setOffset(this.width * 0.25, this.height * 0.2);

    // Blend mode
    this.setBlendMode(Phaser.BlendModes.MULTIPLY);

    // ── Rendre le sprite cliquable ──
    this.setInteractive({ useHandCursor: true });

    // ── Texte du nom ──
    this.nameText = scene.add.text(x, y - 48, characterData.name, {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(10);

    // ── Barre de vie ──
    this.createHealthBar();

    // ── Halo de sélection ──
    this.selectionCircle = scene.add.graphics();
    this.selectionCircle.setDepth(0);
    this.isSelected = false;
  }

  /**
   * Crée la barre de vie au-dessus du joueur
   */
  createHealthBar() {
    const barWidth = 50;
    const barHeight = 6;

    // Fond de la barre (gris foncé)
    this.hpBarBg = this.scene.add.graphics();
    this.hpBarBg.setDepth(9);

    // Barre de vie (rouge → vert selon %)
    this.hpBarFill = this.scene.add.graphics();
    this.hpBarFill.setDepth(9);

    this.hpBarWidth = barWidth;
    this.hpBarHeight = barHeight;

    this.drawHealthBar();
  }

  /**
   * Dessine/redessine la barre de vie
   */
  drawHealthBar() {
    const barX = this.x - this.hpBarWidth / 2;
    const barY = this.y - 38;

    // Fond
    this.hpBarBg.clear();
    this.hpBarBg.fillStyle(0x222222, 0.8);
    this.hpBarBg.fillRoundedRect(barX - 1, barY - 1, this.hpBarWidth + 2, this.hpBarHeight + 2, 2);

    // Remplissage
    const percent = Math.max(0, this.currentHp / this.maxHp);
    const fillWidth = this.hpBarWidth * percent;

    // Couleur : vert → jaune → rouge
    let color;
    if (percent > 0.6) color = 0x2ecc71;
    else if (percent > 0.3) color = 0xf39c12;
    else color = 0xe74c3c;

    this.hpBarFill.clear();
    if (fillWidth > 0) {
      this.hpBarFill.fillStyle(color, 1);
      this.hpBarFill.fillRoundedRect(barX, barY, fillWidth, this.hpBarHeight, 2);
    }
  }

  /**
   * Met à jour la barre de vie avec les données du serveur
   */
  updateHealth(hp, maxHp) {
    this.currentHp = hp;
    this.maxHp = maxHp;
  }

  /**
   * Met à jour le mana
   */
  updateMana(mana, maxMana) {
    this.currentMana = mana;
    this.maxMana = maxMana;
  }

  /**
   * Gère l'état de mort
   */
  setDead(isDead) {
    this.playerIsDead = isDead;
    if (isDead) {
      this.setTint(0x555555);
      this.setAlpha(0.5);
      this.nameText.setAlpha(0.5);
    } else {
      this.clearTint();
      this.setAlpha(1);
      this.nameText.setAlpha(1);
    }
  }

  /**
   * Affiche/masque le halo de sélection
   */
  setSelected(selected) {
    this.isSelected = selected;
  }

  /**
   * Dessine le halo de sélection
   */
  drawSelection() {
    this.selectionCircle.clear();
    if (this.isSelected) {
      this.selectionCircle.lineStyle(2, 0xff4444, 0.8);
      this.selectionCircle.strokeCircle(this.x, this.y + 8, 36);
    }
  }

  /**
   * Définit la nouvelle destination dictée par le serveur
   */
  setTargetPosition(x, y) {
    // Calcul de la direction visuelle pour le flip
    if (x < this.targetX) this.setFlipX(true);
    else if (x > this.targetX) this.setFlipX(false);

    // Si l'écart est trop grand (téléportation, spawn), on saute direct
    const dist = Phaser.Math.Distance.Between(this.x, this.y, x, y);
    if (dist > 150) {
      this.setPosition(x, y);
    }

    this.targetX = x;
    this.targetY = y;
  }

  /**
   * Appelé à chaque frame pour glisser doucement vers targetX/targetY
   */
  updateLerp(delta) {
    const lerpFactor = 0.2; 
    
    this.x += (this.targetX - this.x) * lerpFactor;
    this.y += (this.targetY - this.y) * lerpFactor;

    // Le nom, la barre de vie et la sélection suivent le joueur
    this.nameText.setPosition(this.x, this.y - 48);
    this.drawHealthBar();
    this.drawSelection();
  }

  // Permet de supprimer proprement l'entité
  destroy(fromScene) {
    if (this.nameText) this.nameText.destroy();
    if (this.hpBarBg) this.hpBarBg.destroy();
    if (this.hpBarFill) this.hpBarFill.destroy();
    if (this.selectionCircle) this.selectionCircle.destroy();
    super.destroy(fromScene);
  }
}
