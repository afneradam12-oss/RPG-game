import { v4 as uuidv4 } from 'uuid';
import { MONSTER_TYPES } from '../../../shared/data/monsters.js';

export class MonsterState {
  constructor(typeKey, spawnX, spawnY) {
    this.id = uuidv4(); // ID unique pour le réseau
    this.typeKey = typeKey;
    
    const config = MONSTER_TYPES[typeKey];
    this.name = config.name;
    this.spriteKey = config.spriteKey;
    
    // Position
    this.x = spawnX;
    this.y = spawnY;
    this.spawnX = spawnX;
    this.spawnY = spawnY;
    
    // Stats
    this.hp = config.hp;
    this.maxHp = config.hp;
    this.damage = config.damage;
    this.speed = config.speed;
    this.aggroRange = config.aggroRange;
    this.attackRange = config.attackRange;
    this.attackCooldown = config.attackCooldown;
    this.patrolRadius = config.patrolRadius;
    this.xpReward = config.xpReward;
    this.respawnTime = config.respawnTime;

    // État IA
    this.isDead = false;
    this.state = 'idle'; // 'idle' | 'patrol' | 'pursuit' | 'attack' | 'return'
    this.targetPlayerId = null;
    
    // Timers
    this.currentAttackCooldown = 0;
    this.deadTimer = 0;
    this.patrolTimer = 0;
    
    // Cible de déplacement (patrouille ou retour)
    this.targetX = spawnX;
    this.targetY = spawnY;
  }

  takeDamage(amount) {
    if (this.isDead) return 0;
    
    const realDamage = Math.min(this.hp, Math.max(0, Math.round(amount)));
    this.hp -= realDamage;
    
    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
      this.deadTimer = this.respawnTime;
      this.state = 'dead';
      this.targetPlayerId = null;
    }
    
    return realDamage;
  }

  respawn() {
    this.isDead = false;
    this.hp = this.maxHp;
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.targetX = this.spawnX;
    this.targetY = this.spawnY;
    this.state = 'idle';
    this.targetPlayerId = null;
    this.currentAttackCooldown = 0;
    this.deadTimer = 0;
  }

  canAttack() {
    return !this.isDead && this.currentAttackCooldown <= 0;
  }

  getNetworkData() {
    return {
      id: this.id,
      typeKey: this.typeKey,
      name: this.name,
      spriteKey: this.spriteKey,
      x: Math.round(this.x),
      y: Math.round(this.y),
      hp: Math.round(this.hp),
      maxHp: this.maxHp,
      isDead: this.isDead,
    };
  }
}
