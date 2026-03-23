/**
 * Représente l'état en mémoire d'un joueur actif sur le serveur.
 */
export class PlayerState {
  constructor(socketId, user, character) {
    this.socketId = socketId;     // ID de connexion Socket.io
    this.userId = user._id;       // Mongo ID du User
    this.charId = character._id;  // Mongo ID du Character
    
    this.name = character.name;
    this.className = character.className;
    this.level = character.level;
    
    // Position (charger la position sauvegardée, sinon centre de la map)
    this.x = character.position?.x || 400;
    this.y = character.position?.y || 300;

    // Vitesse (à extraire des stats plus tard, statique pour l'instant)
    this.speed = 150; 

    // Inputs actuels appuyés par le client
    this.inputs = {
      up: false,
      down: false,
      left: false,
      right: false,
    };
  }

  /**
   * Applique le vecteur de déplacement en fonction des inputs
   * @param {number} deltaSeconds - Temps écoulé depuis le dernier tick (en secondes)
   */
  applyInputs(deltaSeconds) {
    let vx = 0;
    let vy = 0;

    if (this.inputs.up) vy -= 1;
    if (this.inputs.down) vy += 1;
    if (this.inputs.left) vx -= 1;
    if (this.inputs.right) vx += 1;

    // Normalisation diagonale
    if (vx !== 0 && vy !== 0) {
      const factor = Math.SQRT1_2;
      vx *= factor;
      vy *= factor;
    }

    this.x += vx * this.speed * deltaSeconds;
    this.y += vy * this.speed * deltaSeconds;

    // TODO: Collision avec la map (bords de l'écran pour l'instant)
    const MAX_X = 50 * 32; // MAP_WIDTH_TILES * TILE_SIZE
    const MAX_Y = 50 * 32;

    if (this.x < 0) this.x = 0;
    if (this.x > MAX_X) this.x = MAX_X;
    if (this.y < 0) this.y = 0;
    if (this.y > MAX_Y) this.y = MAX_Y;
  }

  updateInputs(newInputs) {
    this.inputs = { ...this.inputs, ...newInputs };
  }

  // Renvoie un objet épuré pour le réseau
  getNetworkData() {
    return {
      id: this.charId,
      name: this.name,
      className: this.className,
      x: Math.round(this.x),
      y: Math.round(this.y),
    };
  }
}
