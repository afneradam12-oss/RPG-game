import Phaser from 'phaser';

/**
 * Entité Player — Encapsule la logique d'un joueur.
 * Fonctionne maintenant en mode "Dumb Client" :
 * - N'utilise pas la vélocité physique locale.
 * - S'interpole doucement (Lerp) vers la position dictée par le serveur.
 */
export default class PlayerSprite extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, characterData) {
    super(scene, x, y, texture);

    this.scene = scene;
    this.characterData = characterData;
    this.charId = characterData.id || characterData._id; // id réseau (MongoDB _id)

    // Position "vraie" annoncée par le serveur
    this.targetX = x;
    this.targetY = y;

    // Ajouter l'objet à la scène
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Collider du monde (utile pour ne pas sortir de la caméra localement en attendant le serveur)
    this.setCollideWorldBounds(true);
    
    // Adapter la taille
    this.setDisplaySize(64, 64);
    this.body.setSize(this.width * 0.5, this.height * 0.8);
    this.body.setOffset(this.width * 0.25, this.height * 0.2);

    // Si on a généré sur fond blanc ou noir avec l'IA
    this.setBlendMode(Phaser.BlendModes.MULTIPLY);

    // Conteneur pour le nom
    this.nameText = scene.add.text(x, y - 40, characterData.name, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
  }

  /**
   * Définit la nouvelle destination dictée par le serveur
   */
  setTargetPosition(x, y) {
    // Calcul de la direction visuelle pour le flip
    if (x < this.targetX) this.setFlipX(true);
    else if (x > this.targetX) this.setFlipX(false);

    // Si l'écart est trop grand (ex: téléportation, spawn), on saute direct
    const dist = Phaser.Math.Distance.Between(this.x, this.y, x, y);
    if (dist > 150) {
      this.setPosition(x, y);
    }

    this.targetX = x;
    this.targetY = y;
  }

  /**
   * Appelé à chaque frame (ex: 60 FPS) pour glisser doucement vers targetX/targetY
   */
  updateLerp(delta) {
    // Algorithme de Linear Interpolation (Lerp)
    // 0.2 est le facteur de lissage. Plus il est proche de 1, plus c'est instantané.
    // Plus il est proche de 0, plus c'est glissant.
    const lerpFactor = 0.2; 
    
    this.x += (this.targetX - this.x) * lerpFactor;
    this.y += (this.targetY - this.y) * lerpFactor;

    // Le nom suit le joueur
    this.nameText.setPosition(this.x, this.y - 40);
  }

  // Permet de supprimer proprement l'entité
  destroy(fromScene) {
    if (this.nameText) this.nameText.destroy();
    super.destroy(fromScene);
  }
}
