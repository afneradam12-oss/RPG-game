import { TICK_RATE, SOCKET_EVENTS } from '../../../shared/constants.js';
import { combatSystem } from './CombatSystem.js';

/**
 * Moteur principal de jeu (Server-Authoritative)
 */
class GameEngine {
  constructor() {
    this.players = new Map(); // socket.id -> PlayerState
    this.io = null;
    this.lastTick = Date.now();
  }

  // Injecte l'instance Socket.io pour pouvoir faire des broadcasts
  setIO(io) {
    this.io = io;
    combatSystem.setIO(io);
  }

  addPlayer(socketId, playerState) {
    this.players.set(socketId, playerState);
    console.log(`🎮 [GameEngine] Joueur ajouté : ${playerState.name}`);
  }

  removePlayer(socketId) {
    const player = this.players.get(socketId);
    if (player) {
      console.log(`🎮 [GameEngine] Joueur retiré : ${player.name}`);
      this.players.delete(socketId);
      
      // Avertir tout le monde que le joueur est parti
      if (this.io) {
        this.io.emit(SOCKET_EVENTS.PLAYER_LEAVE, { id: player.charId });
      }
    }
  }

  updatePlayerInputs(socketId, inputs) {
    const player = this.players.get(socketId);
    if (player) {
      player.updateInputs(inputs);
    }
  }

  /**
   * Retourne un joueur par son socketId
   */
  getPlayer(socketId) {
    return this.players.get(socketId);
  }

  /**
   * Démarre la boucle de Tick
   */
  start() {
    console.log(`⏱️  [GameEngine] Boucle démarrée à ${TICK_RATE} TPS`);
    this.lastTick = Date.now();
    
    setInterval(() => {
      this.tick();
    }, 1000 / TICK_RATE);
  }

  /**
   * Le "Tick" du serveur : physique, combat, et broadcast
   */
  tick() {
    const now = Date.now();
    const deltaMs = now - this.lastTick;
    const deltaSeconds = deltaMs / 1000;
    this.lastTick = now;

    // 1. Mettre à jour les cooldowns de combat
    combatSystem.updateCooldowns(this.players, deltaMs);

    // 2. Gérer les respawns
    combatSystem.handleRespawns(this.players, deltaMs);

    // 3. Regen mana passive
    combatSystem.regenMana(this.players, deltaSeconds);

    const stateUpdate = {};
    let hasPlayers = false;

    // 4. Mettre à jour tous les joueurs (mouvement)
    for (const [socketId, player] of this.players.entries()) {
      player.applyInputs(deltaSeconds);
      
      // On regroupe les données de tout le monde
      stateUpdate[player.charId] = player.getNetworkData();
      hasPlayers = true;
    }

    // 5. Broadcast uniquement s'il y a du monde
    if (hasPlayers && this.io) {
      this.io.emit(SOCKET_EVENTS.GAME_STATE, stateUpdate);
    }
  }
}

// Singleton global
export const gameEngine = new GameEngine();
