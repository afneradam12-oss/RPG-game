import jwt from 'jsonwebtoken';
import { SOCKET_EVENTS } from '../../../shared/constants.js';
import Character from '../models/Character.js';
import { gameEngine } from '../game/GameLoop.js';
import { combatSystem } from '../game/CombatSystem.js';
import { PlayerState } from '../game/PlayerState.js';

export function setupSocketHandlers(io) {
  // Configurer l'instance IO pour le moteur
  gameEngine.setIO(io);

  // Middleware d'authentification Socket.io
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Token manquant'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('Token invalide'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connecté : (socket: ${socket.id})`);

    // Confirmer l'authentification au client
    socket.emit(SOCKET_EVENTS.AUTH_SUCCESS, {
      message: 'Connecté au serveur de jeu',
      userId: socket.userId,
    });

    // ── GESTION DU JEU ── //

    // 1. Le joueur rejoint officiellement la carte
    socket.on(SOCKET_EVENTS.PLAYER_JOIN, async (data) => {
      try {
        const characterId = data.characterId;

        // Charger les données du personnage depuis la BDD
        const character = await Character.findOne({ _id: characterId, userId: socket.userId });
        
        if (!character) {
          socket.emit(SOCKET_EVENTS.AUTH_ERROR, { message: 'Personnage invalide' });
          return;
        }

        // Créer l'état en mémoire
        const userMock = { _id: socket.userId };
        const playerState = new PlayerState(socket.id, userMock, character);
        
        // L'ajouter au moteur
        gameEngine.addPlayer(socket.id, playerState);

        console.log(`🗺️  ${character.name} est entré dans le monde !`);
      } catch (error) {
        console.error('Erreur PLAYER_JOIN:', error);
      }
    });

    // 2. Le joueur envoie ses touches de direction
    socket.on(SOCKET_EVENTS.PLAYER_INPUT, (inputs) => {
      gameEngine.updatePlayerInputs(socket.id, inputs);
    });

    // ── COMBAT ── //

    // 3. Attaque de base (clic sur un joueur)
    socket.on(SOCKET_EVENTS.PLAYER_ATTACK, (data) => {
      const attacker = gameEngine.getPlayer(socket.id);
      if (!attacker || !data.targetId) return;
      
      combatSystem.processAttack(attacker, data.targetId, gameEngine.players);
    });

    // 4. Lancer un sort (touches 1-2-3-4)
    socket.on(SOCKET_EVENTS.PLAYER_CAST_SPELL, (data) => {
      const attacker = gameEngine.getPlayer(socket.id);
      if (!attacker) return;
      
      const spellIndex = parseInt(data.spellIndex);
      if (isNaN(spellIndex) || spellIndex < 0 || spellIndex > 3) return;
      if (!data.targetId) return;

      combatSystem.processSpell(attacker, spellIndex, data.targetId, gameEngine.players);
    });

    // 5. Déconnexion
    socket.on('disconnect', (reason) => {
      gameEngine.removePlayer(socket.id);
      console.log(`🔌 Client déconnecté (${reason})`);
    });
  });
}
