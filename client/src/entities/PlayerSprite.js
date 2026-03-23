import Phaser from 'phaser';

/**
 * Entité Player — Encapsule la logique du joueur (sprite, physique, nom)
 */
export default class PlayerSprite extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, characterData) {
    super(scene, x, y, texture);

    this.scene = scene;
    this.characterData = characterData;

    // Ajouter l'objet à la scène et activer la physique
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Collider du monde
    this.setCollideWorldBounds(true);
    
    // Adapter la taille de la hitbox et le scale si l'image générée est grande
    // L'image IA est souvent 512x512 ou 1024x1024, on la réduit à une taille "RPG" (~64x64)
    this.setDisplaySize(64, 64);
    this.body.setSize(this.width * 0.5, this.height * 0.8);
    this.body.setOffset(this.width * 0.25, this.height * 0.2);

    // Conteneur pour le nom pour qu'il suive le joueur
    this.nameText = scene.add.text(x, y - 40, characterData.name, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
  }

  update(keys, speed) {
    let vx = 0;
    let vy = 0;

    if (keys.z.isDown || keys.up.isDown) vy -= 1;
    if (keys.s.isDown || keys.down.isDown) vy += 1;
    if (keys.q.isDown || keys.left.isDown) vx -= 1;
    if (keys.d.isDown || keys.right.isDown) vx += 1;

    // Normaliser la vitesse en diagonale
    if (vx !== 0 && vy !== 0) {
      const factor = Math.SQRT1_2;
      vx *= factor;
      vy *= factor;
    }

    this.setVelocity(vx * speed, vy * speed);

    // S'il y avait une spritesheet, c'est ici qu'on gèrerait les animations
    // (ex: if (vx > 0) this.anims.play('walk_right'))
    
    // Flip l'image horizontalement pour regarder à gauche ou à droite
    if (vx < 0) this.setFlipX(true);
    else if (vx > 0) this.setFlipX(false);

    // Le nom suit le joueur
    this.nameText.setPosition(this.x, this.y - 40);
  }

  // Permet de supprimer proprement l'entité
  destroy(fromScene) {
    if (this.nameText) this.nameText.destroy();
    super.destroy(fromScene);
  }
}
