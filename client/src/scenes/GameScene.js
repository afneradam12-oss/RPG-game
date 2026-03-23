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

    // ── 1. Génération de la Tilemap ──
    // Création d'une tilemap vierge 50x50 avec des tuiles de 32x32
    this.map = this.make.tilemap({ 
      width: MAP_WIDTH_TILES, 
      height: MAP_HEIGHT_TILES, 
      tileWidth: TILE_SIZE, 
      tileHeight: TILE_SIZE 
    });

    // Ajout du tileset (texture "tiles_grass" chargée dans BootScene)
    // On spécifie que la taille des tuiles dans l'image est la dimension de l'image (si c'est une seule tuile)
    // ou 32x32 si c'est un vrai tileset. Ici l'IA a généré une image simple.
    const tileset = this.map.addTilesetImage('tiles_grass', 'tiles_grass', TILE_SIZE, TILE_SIZE, 0, 0);

    // Création du calque (layer) pour le sol
    const groundLayer = this.map.createBlankLayer('GroundLayer', tileset);
    
    // Remplissage avec l'index 0 (la première tuile du tileset)
    groundLayer.fill(0);

    // ── 2. Création du joueur ──
    const startX = this.character.position?.x || 400;
    const startY = this.character.position?.y || 300;

    this.player = new PlayerSprite(
      this, 
      startX, 
      startY, 
      'hero', 
      this.character
    );

    // ── 3. Caméra et Limites Physiques ──
    // La caméra et la physique ne peuvent pas dépasser la taille de la map
    const mapWidthPx = MAP_WIDTH_TILES * TILE_SIZE;
    const mapHeightPx = MAP_HEIGHT_TILES * TILE_SIZE;

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
