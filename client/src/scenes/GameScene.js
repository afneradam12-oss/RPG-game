import Phaser from 'phaser';
import PlayerSprite from '../entities/PlayerSprite.js';
import socketManager from '../network/SocketManager.js';
import { SOCKET_EVENTS, MAP_WIDTH_TILES, MAP_HEIGHT_TILES, TILE_SIZE } from '../../../shared/constants.js';

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
    console.log(`🎮 GameScene Démarrée avec ${this.character.name}`);

    // Informer le serveur que l'on rejoint le jeu monde avec ce perso !
    socketManager.emit(SOCKET_EVENTS.PLAYER_JOIN, { characterId: this.character._id });

    // Dictionnaire des autres joueurs { id: PlayerSprite }
    this.otherPlayers = new Map();

    const { width, height } = this.cameras.main;
    const mapWidthPx = MAP_WIDTH_TILES * TILE_SIZE;
    const mapHeightPx = MAP_HEIGHT_TILES * TILE_SIZE;

    // ── 1. Génération du Sol (TileSprite) ──
    this.ground = this.add.tileSprite(0, 0, mapWidthPx, mapHeightPx, 'tiles_grass');
    this.ground.setOrigin(0, 0);

    // ── 2. Création du joueur local ──
    const startX = this.character.position?.x || 400;
    const startY = this.character.position?.y || 300;
    const spriteKey = this.character.className.toLowerCase();

    this.player = new PlayerSprite(this, startX, startY, spriteKey, this.character);

    // ── 3. Caméra et Limites Physiques ──
    this.cameras.main.setBounds(0, 0, mapWidthPx, mapHeightPx);
    this.physics.world.setBounds(0, 0, mapWidthPx, mapHeightPx);
    // Suivi fluide du joueur local
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // ── 4. Contrôles ──
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
    this.scene.launch('UIScene', { character: this.character });

    // ── 6. Réseau (Électro-choc multijoueur) ──
    
    // Réception de l'état global 20 fois par seconde
    socketManager.on(SOCKET_EVENTS.GAME_STATE, this.onGameStateUpdate.bind(this));

    // Déconnexion d'un joueur
    socketManager.on(SOCKET_EVENTS.PLAYER_LEAVE, (data) => {
      const p = this.otherPlayers.get(data.id);
      if (p) {
        p.destroy();
        this.otherPlayers.delete(data.id);
      }
    });

    // Nettoyage à la fermeture de la scène
    this.events.on('shutdown', () => {
      socketManager.off(SOCKET_EVENTS.GAME_STATE);
      socketManager.off(SOCKET_EVENTS.PLAYER_LEAVE);
    });
  }

  /**
   * Fusion de l'état reçu du serveur avec la scène affichée
   */
  onGameStateUpdate(serverState) {
    const localId = this.character._id;

    // Parcourir tous les joueurs envoyés par le serveur
    for (const [id, netData] of Object.entries(serverState)) {
      
      if (id === localId) {
        // C'est nous !
        // Le serveur nous dit où nous DEVONS être.
        this.player.setTargetPosition(netData.x, netData.y);
      } else {
        // C'est un autre joueur
        let otherPlayer = this.otherPlayers.get(id);
        
        if (!otherPlayer) {
          // Nouveau joueur qui vient d'apparaître sur notre écran !
          const spriteKey = netData.className.toLowerCase();
          otherPlayer = new PlayerSprite(this, netData.x, netData.y, spriteKey, netData);
          this.otherPlayers.set(id, otherPlayer);
        } else {
          // Joueur déjà là, on met à jour sa destination
          otherPlayer.setTargetPosition(netData.x, netData.y);
        }
      }
    }

    // Gérer ceux qui auraient disparu du serveur (garbage collection de sécu)
    for (const [id, sprite] of this.otherPlayers.entries()) {
      if (!serverState[id]) {
        sprite.destroy();
        this.otherPlayers.delete(id);
      }
    }
  }

  update(time, delta) {
    // 1. Envoyer NOS inputs pressés au serveur
    const inputs = {
      up: this.keys.z.isDown || this.keys.up.isDown,
      down: this.keys.s.isDown || this.keys.down.isDown,
      left: this.keys.q.isDown || this.keys.left.isDown,
      right: this.keys.d.isDown || this.keys.right.isDown,
    };
    
    socketManager.emit(SOCKET_EVENTS.PLAYER_INPUT, inputs);

    // 2. Interpoler la position de tout le monde (mouvement visuel fluide)
    this.player.updateLerp(delta);
    
    for (const otherPlayer of this.otherPlayers.values()) {
      otherPlayer.updateLerp(delta);
    }
  }
}
