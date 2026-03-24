import Phaser from 'phaser';
import PlayerSprite from '../entities/PlayerSprite.js';
import MonsterSprite from '../entities/MonsterSprite.js';
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
    // Dictionnaire des monstres { id: MonsterSprite }
    this.monsters = new Map();

    // Cible sélectionnée (Sprite joueur ou monstre)
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

    // ── 5. Contrôles combat (sorts 1-2-3-4) — Écouteurs événementiels ──
    this.input.keyboard.on('keydown', (event) => {
      let spellIndex = -1;

      // Support clavier AZERTY (& é " ') et QWERTY (1 2 3 4) + Numpad
      switch (event.code) {
        case 'Digit1': case 'Numpad1': spellIndex = 0; break;
        case 'Digit2': case 'Numpad2': spellIndex = 1; break;
        case 'Digit3': case 'Numpad3': spellIndex = 2; break;
        case 'Digit4': case 'Numpad4': spellIndex = 3; break;
      }

      if (spellIndex >= 0) {
        this.castSpell(spellIndex);
      }
    });

    // ── 6. Clic pour cibler & attaquer (Joueur ou Monstre) ──
    this.input.on('gameobjectdown', (pointer, gameObject) => {
      // Ignorer si on clique sur soi-même
      if (gameObject === this.player) return;

      if (gameObject instanceof PlayerSprite || gameObject instanceof MonsterSprite) {
        // Sélectionner la cible
        this.selectTarget(gameObject);

        // Attaque de base au clic gauche
        if (pointer.leftButtonDown()) {
          if (gameObject instanceof PlayerSprite) {
            socketManager.emit(SOCKET_EVENTS.PLAYER_ATTACK, {
              targetId: gameObject.charId,
            });
          } else if (gameObject instanceof MonsterSprite) {
            socketManager.emit(SOCKET_EVENTS.ATTACK_MONSTER, {
              targetId: gameObject.charId,
            });
          }
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

    // Réception de l'état des monstres
    socketManager.on(SOCKET_EVENTS.MONSTERS_STATE, this.onMonstersStateUpdate.bind(this));

    // Dégâts reçus
    socketManager.on(SOCKET_EVENTS.COMBAT_HIT, this.onCombatHit.bind(this));

    // Mort d'un joueur ou monstre
    socketManager.on(SOCKET_EVENTS.PLAYER_DIED, this.onPlayerDied.bind(this));
    socketManager.on(SOCKET_EVENTS.MONSTER_DIED, this.onMonsterDied.bind(this));

    // Respawn d'un joueur ou monstre
    socketManager.on(SOCKET_EVENTS.PLAYER_RESPAWN, this.onPlayerRespawn.bind(this));
    socketManager.on(SOCKET_EVENTS.MONSTER_RESPAWN, this.onMonsterRespawn.bind(this));

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

  // ── Lancer un sort ──

  castSpell(spellIndex) {
    if (this.player.playerIsDead) return;
    if (!this.selectedTarget) {
      console.log('⚠️ Aucune cible sélectionnée ! Cliquez sur un joueur d\'abord.');
      return;
    }

    console.log(`🔮 Sort ${spellIndex + 1} lancé sur ${this.selectedTarget.charId}`);
    socketManager.emit(SOCKET_EVENTS.PLAYER_CAST_SPELL, {
      spellIndex: spellIndex,
      targetId: this.selectedTarget.charId,
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

  onMonstersStateUpdate(monstersState) {
    for (const [id, netData] of Object.entries(monstersState)) {
      let monster = this.monsters.get(id);

      if (!monster) {
        monster = new MonsterSprite(this, netData.x, netData.y, netData.spriteKey, netData);
        this.monsters.set(id, monster);
      } else {
        monster.setTargetPosition(netData.x, netData.y);
      }

      monster.updateHealth(netData.hp, netData.maxHp);
      
      // Mettre à jour l'état mort si changé
      if (monster.isDead !== netData.isDead) {
        monster.setDeadState(netData.isDead);
      }
    }
  }

  // ── Réseau : combat ──

  onCombatHit(data) {
    // Trouver la cible pour afficher le floating damage
    let targetSprite = null;

    if (data.targetId?.toString() === this.character._id?.toString()) {
      targetSprite = this.player;
    } else if (this.otherPlayers.has(data.targetId?.toString())) {
      targetSprite = this.otherPlayers.get(data.targetId?.toString());
    } else if (this.monsters.has(data.targetId?.toString())) {
      targetSprite = this.monsters.get(data.targetId?.toString());
    }

    if (targetSprite) {
      this.showFloatingDamage(targetSprite.x, targetSprite.y, data.damage, data.isSpell);
    }
  }

  onPlayerDied(data) {
    console.log(`💀 Joueur ${data.playerId} est mort !`);
  }

  onMonsterDied(data) {
    const m = this.monsters.get(data.id);
    if (m) m.setDeadState(true);
  }

  onPlayerRespawn(data) {
    console.log(`✨ Joueur ${data.playerId} a respawn !`);
  }

  onMonsterRespawn(data) {
    const m = this.monsters.get(data.id);
    if (m) m.setDeadState(false);
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

    // 2. Interpoler la position de tout le monde
    this.player.updateLerp(delta);
    
    for (const otherPlayer of this.otherPlayers.values()) {
      otherPlayer.updateLerp(delta);
    }

    for (const monster of this.monsters.values()) {
      monster.updateLerp(delta);
    }
  }
}
