import { CLASS_SPELLS } from '../../../shared/data/spells.js';

/**
 * Représente l'état en mémoire d'un joueur actif sur le serveur.
 * Inclut maintenant : stats de combat, HP, mana, cooldowns, mort/respawn.
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

    // Vitesse
    this.speed = 150; 

    // ── Stats de combat ──
    const stats = character.stats || {};
    this.hp = stats.hp || 100;
    this.maxHp = stats.maxHp || 100;
    this.mana = stats.mana || 50;
    this.maxMana = stats.maxMana || 50;
    this.strength = stats.strength || 10;
    this.dexterity = stats.dexterity || 10;
    this.intelligence = stats.intelligence || 10;
    this.vitality = stats.vitality || 10;

    // ── État de combat ──
    this.isDead = false;
    this.respawnTimer = 0;        // ms restants avant respawn
    this.attackCooldown = 0;      // ms restants avant prochaine attaque de base

    // Cooldowns des 4 sorts (en ms restants)
    this.spellCooldowns = [0, 0, 0, 0];

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
   */
  applyInputs(deltaSeconds) {
    // Un joueur mort ne peut pas bouger
    if (this.isDead) return;

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

    // Collision avec les bords de la map
    const MAX_X = 50 * 32;
    const MAX_Y = 50 * 32;

    if (this.x < 0) this.x = 0;
    if (this.x > MAX_X) this.x = MAX_X;
    if (this.y < 0) this.y = 0;
    if (this.y > MAX_Y) this.y = MAX_Y;
  }

  updateInputs(newInputs) {
    this.inputs = { ...this.inputs, ...newInputs };
  }

  // ── Combat ──

  /**
   * Inflige des dégâts au joueur. Retourne les dégâts réels infligés.
   */
  takeDamage(amount) {
    if (this.isDead) return 0;

    const realDamage = Math.min(this.hp, Math.max(0, Math.round(amount)));
    this.hp -= realDamage;

    if (this.hp <= 0) {
      this.hp = 0;
      this.die();
    }

    return realDamage;
  }

  /**
   * Le joueur meurt
   */
  die() {
    this.isDead = true;
    this.respawnTimer = 5000; // RESPAWN_DELAY
    this.inputs = { up: false, down: false, left: false, right: false };
  }

  /**
   * Respawn le joueur avec tous ses HP
   */
  respawn() {
    this.isDead = false;
    this.hp = this.maxHp;
    this.mana = this.maxMana;
    this.respawnTimer = 0;
    // Respawn au centre de la map
    this.x = 400 + Math.random() * 200 - 100;
    this.y = 300 + Math.random() * 200 - 100;
    this.attackCooldown = 0;
    this.spellCooldowns = [0, 0, 0, 0];
  }

  /**
   * Vérifie si l'attaque de base est prête
   */
  canAttack() {
    return !this.isDead && this.attackCooldown <= 0;
  }

  /**
   * Vérifie si un sort peut être lancé
   */
  canCastSpell(spellIndex) {
    if (this.isDead) return false;
    if (spellIndex < 0 || spellIndex > 3) return false;
    if (this.spellCooldowns[spellIndex] > 0) return false;

    const spells = CLASS_SPELLS[this.className];
    if (!spells || !spells[spellIndex]) return false;

    return this.mana >= spells[spellIndex].manaCost;
  }

  /**
   * Consomme du mana
   */
  consumeMana(amount) {
    this.mana = Math.max(0, this.mana - amount);
  }

  /**
   * Regen le mana passivement
   */
  regenMana(deltaSeconds) {
    if (this.isDead) return;
    this.mana = Math.min(this.maxMana, this.mana + 2 * deltaSeconds);
  }

  /**
   * Met à jour tous les cooldowns
   */
  updateCooldowns(deltaMs) {
    if (this.attackCooldown > 0) {
      this.attackCooldown = Math.max(0, this.attackCooldown - deltaMs);
    }

    for (let i = 0; i < this.spellCooldowns.length; i++) {
      if (this.spellCooldowns[i] > 0) {
        this.spellCooldowns[i] = Math.max(0, this.spellCooldowns[i] - deltaMs);
      }
    }

    // Respawn timer
    if (this.isDead && this.respawnTimer > 0) {
      this.respawnTimer -= deltaMs;
    }
  }

  // Renvoie un objet épuré pour le réseau
  getNetworkData() {
    return {
      id: this.charId,
      name: this.name,
      className: this.className,
      x: Math.round(this.x),
      y: Math.round(this.y),
      hp: Math.round(this.hp),
      maxHp: this.maxHp,
      mana: Math.round(this.mana),
      maxMana: this.maxMana,
      isDead: this.isDead,
      level: this.level,
    };
  }
}
