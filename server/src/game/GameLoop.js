import { TICK_RATE, SOCKET_EVENTS } from '../../../shared/constants.js';

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
      
      // Avertir tout le monde que le joueur est parti (pour que les clients le détruisent)
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
   * Le "Tick" du serveur : mis à jour de la physique et broadcast de l'état
   */
  tick() {
    const now = Date.now();
    // DeltaT en secondes (généralement ~0.05s pour 20 TPS)
    const deltaSeconds = (now - this.lastTick) / 1000;
    this.lastTick = now;

    const stateUpdate = {};
    let hasPlayers = false;

    // Mettre à jour tous les joueurs
    for (const [socketId, player] of this.players.entries()) {
      player.applyInputs(deltaSeconds);
      
      // On regroupe les données de tout le monde
      stateUpdate[player.charId] = player.getNetworkData();
      hasPlayers = true;
    }

    // Broadcast uniquement s'il y a du monde
    if (hasPlayers && this.io) {
      this.io.emit(SOCKET_EVENTS.GAME_STATE, stateUpdate);
    }
  }
}

// Singleton global
export const gameEngine = new GameEngine();
