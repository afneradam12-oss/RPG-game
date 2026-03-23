import jwt from 'jsonwebtoken';
import { SOCKET_EVENTS } from '../../../shared/constants.js';

/**
 * Gestion des événements Socket.io
 * Ce handler sera enrichi à l'Étape 3 (synchronisation multijoueur)
 */
export function setupSocketHandlers(io) {
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
    console.log(`🔌 Joueur connecté : ${socket.userId} (socket: ${socket.id})`);

    // Confirmer l'authentification au client
    socket.emit(SOCKET_EVENTS.AUTH_SUCCESS, {
      message: 'Connecté au serveur de jeu',
      userId: socket.userId,
    });

    // Déconnexion
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Joueur déconnecté : ${socket.userId} (${reason})`);
    });

    // ── Les handlers de jeu seront ajoutés à l'Étape 3 ──
    // socket.on(SOCKET_EVENTS.PLAYER_INPUT, ...)
    // socket.on(SOCKET_EVENTS.PLAYER_CAST_SPELL, ...)
  });
}
