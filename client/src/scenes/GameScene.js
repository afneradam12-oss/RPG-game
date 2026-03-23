import Phaser from 'phaser';
import PlayerSprite from '../entities/PlayerSprite.js';
import { PLAYER_SPEED, MAP_WIDTH_TILES, MAP_HEIGHT_TILES, TILE_SIZE } from '../../../shared/constants.js';

/**
 * GameScene — Scène principale de jeu
 * Affiche la map en tuiles et gère le déplacement local du joueur.
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
    const mapWidthPx = MAP_WIDTH_TILES * TILE_SIZE;
    const mapHeightPx = MAP_HEIGHT_TILES * TILE_SIZE;

    // ── 1. Génération du Sol (TileSprite) ──
    // Un TileSprite est parfait pour un sol uni qui se répète sans charger le CPU
    this.ground = this.add.tileSprite(0, 0, mapWidthPx, mapHeightPx, 'tiles_grass');
    this.ground.setOrigin(0, 0);

    // ── 2. Création du joueur ──
    const startX = this.character.position?.x || 400;
    const startY = this.character.position?.y || 300;

    // Récupérer l'image correspondante à la classe (ex: "Assassin" -> "assassin")
    const spriteKey = this.character.class.toLowerCase();

    this.player = new PlayerSprite(
      this, 
      startX, 
      startY, 
      spriteKey, 
      this.character
    );

    // Pour masquer le fond blanc généré par l'IA (produit un effet d'incrustation)
    // NOTE: Si ça assombrit trop le sprite, on retirera le MULTIPLY.
    this.player.setBlendMode(Phaser.BlendModes.MULTIPLY);

    // ── 3. Caméra et Limites Physiques ──
    // La caméra et la physique ne peuvent pas dépasser la taille de la map
    this.cameras.main.setBounds(0, 0, mapWidthPx, mapHeightPx);
    this.physics.world.setBounds(0, 0, mapWidthPx, mapHeightPx);
    
    // La caméra suit le joueur avec un "lerp" (lag fluide)
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // ── 4. Contrôles ──
    // ZQSD + Flèches
    this.keys = {
      z: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
      q: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
      s: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
    };

    // ── 5. HUD ──
    // On lance la scène UIScene par-dessus le jeu
    this.scene.launch('UIScene', {
      character: this.character,
    });

    console.log(`🎮 Jeu démarré sur la nouvelle Map avec ${this.character.name}`);
  }

  update(time, delta) {
    // Déléguer la logique de mouvement à la classe PlayerSprite
    this.player.update(this.keys, PLAYER_SPEED);
  }
}
