import Phaser from 'phaser';

/**
 * GameScene — Scène principale de jeu
 * Pour l'Étape 1, affiche juste la map et le joueur en local.
 * La sync multijoueur sera ajoutée à l'Étape 3.
 */
export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {
    this.token = data.token;
    this.user = data.user;
    this.character = data.character;
  }

  create() {
    const { width, height } = this.cameras.main;

    // ── Génération d'un sol simple (grille de tiles) ──
    for (let x = 0; x < 50; x++) {
      for (let y = 0; y < 50; y++) {
        this.add.image(x * 32 + 16, y * 32 + 16, 'tile_grass');
      }
    }

    // ── Créer le joueur ──
    this.player = this.physics.add.sprite(
      this.character.position?.x || 400,
      this.character.position?.y || 300,
      'player_placeholder'
    );
    this.player.setCollideWorldBounds(true);

    // Nom du joueur au-dessus du sprite
    this.playerNameText = this.add.text(this.player.x, this.player.y - 24, this.character.name, {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // ── Contrôles ZQSD ──
    this.keys = {
      z: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
      q: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
      s: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    // ── Caméra suit le joueur ──
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, 50 * 32, 50 * 32);
    this.physics.world.setBounds(0, 0, 50 * 32, 50 * 32);

    // ── Lancer la scène UI par-dessus ──
    this.scene.launch('UIScene', {
      character: this.character,
    });

    console.log(`🎮 Jeu démarré avec ${this.character.name} (${this.character.className})`);
  }

  update() {
    const speed = 150;
    let vx = 0;
    let vy = 0;

    // Lecture des inputs ZQSD
    if (this.keys.z.isDown) vy -= 1;
    if (this.keys.s.isDown) vy += 1;
    if (this.keys.q.isDown) vx -= 1;
    if (this.keys.d.isDown) vx += 1;

    // Normaliser pour la diagonale
    if (vx !== 0 && vy !== 0) {
      const factor = Math.SQRT1_2; // 1/√2
      vx *= factor;
      vy *= factor;
    }

    this.player.setVelocity(vx * speed, vy * speed);

    // Mettre à jour la position du nom
    this.playerNameText.setPosition(this.player.x, this.player.y - 24);
  }
}
