import jwt from 'jsonwebtoken';
import { SOCKET_EVENTS } from '../../../shared/constants.js';
import Character from '../models/Character.js';
import { gameEngine } from '../game/GameLoop.js';
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

    // 1. Le joueur rejoint officiellement la carte (quand il sélectionne son personnage)
    socket.on(SOCKET_EVENTS.PLAYER_JOIN, async (data) => {
      try {
        const characterId = data.characterId;

        // Charger les données du personnage depuis la BDD
        // On vérifie qu'il appartient bien à cet utilisateur pour la sécurité !
        const character = await Character.findOne({ _id: characterId, userId: socket.userId });
        
        if (!character) {
          socket.emit(SOCKET_EVENTS.AUTH_ERROR, { message: 'Personnage invalide' });
          return;
        }

        // On a besoin d'un mock 'user' avec juste l'ID pour le PlayerState
        const userMock = { _id: socket.userId };
        
        // Créer l'état en mémoire
        const playerState = new PlayerState(socket.id, userMock, character);
        
        // L'ajouter au moteur (il sera automatiquement diffusé au prochain tick)
        gameEngine.addPlayer(socket.id, playerState);

        console.log(`🗺️  ${character.name} est entré dans le monde !`);
      } catch (error) {
        console.error('Erreur PLAYER_JOIN:', error);
      }
    });

    // 2. Le joueur envoie ses touches de direction (60 fois par seconde ou à chaque changement)
    socket.on(SOCKET_EVENTS.PLAYER_INPUT, (inputs) => {
      // inputs a la forme { up: true, down: false, left: false, right: false }
      gameEngine.updatePlayerInputs(socket.id, inputs);
    });

    // 3. Déconnexion (fermeture de l'onglet ou refresh)
    socket.on('disconnect', (reason) => {
      gameEngine.removePlayer(socket.id);
      console.log(`🔌 Client déconnecté (${reason})`);
    });
  });
}
