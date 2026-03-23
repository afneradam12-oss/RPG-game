import { io } from 'socket.io-client';
import { SOCKET_EVENTS } from '../../../shared/constants.js';
import { SOCKET_URL } from '../config.js';

/**
 * Gestionnaire de la connexion Socket.io
 * Centralise toute la communication réseau
 */
class SocketManager {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  /**
   * Se connecte au serveur avec le token JWT
   */
  connect(token) {
    return new Promise((resolve, reject) => {
      this.socket = io(SOCKET_URL, {
        auth: { token },
      });

      this.socket.on('connect', () => {
        console.log('🔌 Connecté au serveur de jeu');
        this.connected = true;
      });

      this.socket.on(SOCKET_EVENTS.AUTH_SUCCESS, (data) => {
        console.log('✅ Authentifié:', data.message);
        resolve(data);
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Erreur de connexion:', error.message);
        this.connected = false;
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 Déconnecté:', reason);
        this.connected = false;
      });
    });
  }

  /**
   * Envoie un événement au serveur
   */
  emit(event, data) {
    if (this.socket && this.connected) {
      this.socket.emit(event, data);
    }
  }

  /**
   * Écoute un événement du serveur
   */
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  /**
   * Arrête d'écouter un événement
   */
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.connected = false;
    }
  }
}

// Singleton
const socketManager = new SocketManager();
export default socketManager;
