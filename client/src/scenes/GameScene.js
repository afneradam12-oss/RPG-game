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

    // Informer le serveur que l'on rejoint le jeu
    socketManager.emit(SOCKET_EVENTS.PLAYER_JOIN, { characterId: this.character._id });

    // Dictionnaire des autres joueurs { id: PlayerSprite }
    this.otherPlayers = new Map();

    // Cible sélectionnée
    this.selectedTarget = null;

    const mapWidthPx = MAP_WIDTH_TILES * TILE_SIZE;
    const mapHeightPx = MAP_HEIGHT_TILES * TILE_SIZE;

    // ── 1. Génération du Sol ──
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
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // ── 4. Contrôles mouvement ──
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

    // ── 5. Contrôles combat (sorts 1-2-3-4) ──
    this.spellKeys = {
      one: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
      two: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
      three: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
      four: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR),
    };

    // ── 6. Clic sur un joueur ennemi pour attaquer / sélectionner ──
    this.input.on('gameobjectdown', (pointer, gameObject) => {
      if (gameObject instanceof PlayerSprite && gameObject !== this.player) {
        // Sélectionner la cible
        this.selectTarget(gameObject);

        // Attaque de base au clic gauche
        if (pointer.leftButtonDown()) {
          socketManager.emit(SOCKET_EVENTS.PLAYER_ATTACK, {
            targetId: gameObject.charId,
          });
        }
      }
    });

    // Clic dans le vide = déselection
    this.input.on('pointerdown', (pointer) => {
      // Vérifier qu'on n'a pas cliqué sur un sprite interactif
      const hit = this.input.hitTestPointer(pointer);
      if (hit.length === 0) {
        this.deselectTarget();
      }
    });

    // ── 7. HUD ──
    this.scene.launch('UIScene', { character: this.character });

    // ── 8. Réseau ──
    
    // Réception de l'état global
    socketManager.on(SOCKET_EVENTS.GAME_STATE, this.onGameStateUpdate.bind(this));

    // Dégâts reçus
    socketManager.on(SOCKET_EVENTS.COMBAT_HIT, this.onCombatHit.bind(this));

    // Mort d'un joueur
    socketManager.on(SOCKET_EVENTS.PLAYER_DIED, this.onPlayerDied.bind(this));

    // Respawn d'un joueur
    socketManager.on(SOCKET_EVENTS.PLAYER_RESPAWN, this.onPlayerRespawn.bind(this));

    // Déconnexion d'un joueur
    socketManager.on(SOCKET_EVENTS.PLAYER_LEAVE, (data) => {
      const p = this.otherPlayers.get(data.id);
      if (p) {
        if (this.selectedTarget === p) this.deselectTarget();
        p.destroy();
        this.otherPlayers.delete(data.id);
      }
    });

    // Nettoyage à la fermeture de la scène
    this.events.on('shutdown', () => {
      socketManager.off(SOCKET_EVENTS.GAME_STATE);
      socketManager.off(SOCKET_EVENTS.PLAYER_LEAVE);
      socketManager.off(SOCKET_EVENTS.COMBAT_HIT);
      socketManager.off(SOCKET_EVENTS.PLAYER_DIED);
      socketManager.off(SOCKET_EVENTS.PLAYER_RESPAWN);
    });
  }

  // ── Sélection de cible ──

  selectTarget(targetSprite) {
    // Déselectionner l'ancien
    if (this.selectedTarget) {
      this.selectedTarget.setSelected(false);
    }
    this.selectedTarget = targetSprite;
    targetSprite.setSelected(true);
  }

  deselectTarget() {
    if (this.selectedTarget) {
      this.selectedTarget.setSelected(false);
      this.selectedTarget = null;
    }
  }

  // ── Réseau : état du jeu ──

  onGameStateUpdate(serverState) {
    const localId = this.character._id;

    for (const [id, netData] of Object.entries(serverState)) {
      
      if (id === localId) {
        // C'est nous !
        this.player.setTargetPosition(netData.x, netData.y);
        this.player.updateHealth(netData.hp, netData.maxHp);
        this.player.updateMana(netData.mana, netData.maxMana);
        this.player.setDead(netData.isDead);

        // Mettre à jour le HUD
        const uiScene = this.scene.get('UIScene');
        if (uiScene && uiScene.updateHUD) {
          uiScene.updateHUD(netData.hp, netData.maxHp, netData.mana, netData.maxMana);
        }
      } else {
        // Autre joueur
        let otherPlayer = this.otherPlayers.get(id);
        
        if (!otherPlayer) {
          const spriteKey = netData.className.toLowerCase();
          otherPlayer = new PlayerSprite(this, netData.x, netData.y, spriteKey, netData);
          
          // Rendre cliquable pour le ciblage
          otherPlayer.on('pointerdown', (pointer) => {
            this.selectTarget(otherPlayer);
            if (pointer.leftButtonDown()) {
              socketManager.emit(SOCKET_EVENTS.PLAYER_ATTACK, {
                targetId: otherPlayer.charId,
              });
            }
          });
          
          this.otherPlayers.set(id, otherPlayer);
        } else {
          otherPlayer.setTargetPosition(netData.x, netData.y);
        }

        // Toujours mettre à jour les stats
        otherPlayer.updateHealth(netData.hp, netData.maxHp);
        otherPlayer.setDead(netData.isDead);
      }
    }

    // Garbage collection : retirer les joueurs disparus du serveur
    for (const [id, sprite] of this.otherPlayers.entries()) {
      if (!serverState[id]) {
        if (this.selectedTarget === sprite) this.deselectTarget();
        sprite.destroy();
        this.otherPlayers.delete(id);
      }
    }
  }

  // ── Réseau : combat ──

  onCombatHit(data) {
    // Trouver la cible pour afficher le floating damage
    let targetSprite = null;

    if (data.targetId?.toString() === this.character._id?.toString()) {
      targetSprite = this.player;
    } else {
      targetSprite = this.otherPlayers.get(data.targetId?.toString());
    }

    if (targetSprite) {
      this.showFloatingDamage(targetSprite.x, targetSprite.y, data.damage, data.isSpell);
    }
  }

  onPlayerDied(data) {
    console.log(`💀 Joueur ${data.playerId} est mort !`);
  }

  onPlayerRespawn(data) {
    console.log(`✨ Joueur ${data.playerId} a respawn !`);
  }

  /**
   * Affiche un texte de dégâts flottant animé
   */
  showFloatingDamage(x, y, damage, isSpell) {
    const color = isSpell ? '#74b9ff' : '#ff6b6b';
    const prefix = isSpell ? '✨ ' : '';

    const dmgText = this.add.text(x, y - 30, `${prefix}-${damage}`, {
      fontFamily: 'Arial',
      fontSize: '18px',
      fontStyle: 'bold',
      color: color,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(100);

    // Animation : monte et disparaît
    this.tweens.add({
      targets: dmgText,
      y: y - 80,
      alpha: 0,
      duration: 1200,
      ease: 'Power2',
      onComplete: () => dmgText.destroy(),
    });
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

    // 2. Lancer un sort si une touche est pressée et qu'on a une cible
    if (this.selectedTarget && !this.player.playerIsDead) {
      if (Phaser.Input.Keyboard.JustDown(this.spellKeys.one)) {
        socketManager.emit(SOCKET_EVENTS.PLAYER_CAST_SPELL, {
          spellIndex: 0,
          targetId: this.selectedTarget.charId,
        });
      }
      if (Phaser.Input.Keyboard.JustDown(this.spellKeys.two)) {
        socketManager.emit(SOCKET_EVENTS.PLAYER_CAST_SPELL, {
          spellIndex: 1,
          targetId: this.selectedTarget.charId,
        });
      }
      if (Phaser.Input.Keyboard.JustDown(this.spellKeys.three)) {
        socketManager.emit(SOCKET_EVENTS.PLAYER_CAST_SPELL, {
          spellIndex: 2,
          targetId: this.selectedTarget.charId,
        });
      }
      if (Phaser.Input.Keyboard.JustDown(this.spellKeys.four)) {
        socketManager.emit(SOCKET_EVENTS.PLAYER_CAST_SPELL, {
          spellIndex: 3,
          targetId: this.selectedTarget.charId,
        });
      }
    }

    // 3. Interpoler la position de tout le monde
    this.player.updateLerp(delta);
    
    for (const otherPlayer of this.otherPlayers.values()) {
      otherPlayer.updateLerp(delta);
    }
  }
}
