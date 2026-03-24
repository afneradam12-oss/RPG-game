import { MONSTER_SPAWNS } from '../../../shared/data/monsters.js';
import { MonsterState } from './MonsterState.js';
import { SOCKET_EVENTS } from '../../../shared/constants.js';

class MonsterManager {
  constructor() {
    this.monsters = new Map(); // id -> MonsterState
    this.io = null;
    this.gameEngine = null;
  }

  init(io, gameEngine) {
    this.io = io;
    this.gameEngine = gameEngine;
    this.spawnAll();
  }

  spawnAll() {
    for (const spawn of MONSTER_SPAWNS) {
      const ms = new MonsterState(spawn.type, spawn.x, spawn.y);
      this.monsters.set(ms.id, ms);
    }
    console.log(`🐉 [MonsterManager] Spawned ${this.monsters.size} monsters`);
  }

  getDistance(x1, y1, x2, y2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
  }

  getMonstersNetworkData() {
    const data = {};
    for (const [id, monster] of this.monsters.entries()) {
      data[id] = monster.getNetworkData();
    }
    return data;
  }

  tick(deltaMs, players) {
    const deltaSec = deltaMs / 1000;

    for (const [id, monster] of this.monsters.entries()) {
      // ── Gestion du Respawn ──
      if (monster.isDead) {
        monster.deadTimer -= deltaMs;
        if (monster.deadTimer <= 0) {
          monster.respawn();
          if (this.io) {
            this.io.emit(SOCKET_EVENTS.MONSTER_RESPAWN, { id: monster.id, x: monster.x, y: monster.y });
          }
        }
        continue;
      }

      // ── Cooldowns ──
      if (monster.currentAttackCooldown > 0) {
        monster.currentAttackCooldown -= deltaMs;
      }

      // ── IA Machine à États ──

      // 1. Chercher la cible la plus proche si on n'en a pas
      if (!monster.targetPlayerId || monster.state === 'idle' || monster.state === 'patrol') {
        let closestPlayer = null;
        let minDistance = monster.aggroRange;

        for (const [, player] of players.entries()) {
          if (player.isDead) continue;
          const dist = this.getDistance(monster.x, monster.y, player.x, player.y);
          if (dist < minDistance) {
            minDistance = dist;
            closestPlayer = player;
          }
        }

        if (closestPlayer) {
          monster.targetPlayerId = closestPlayer.charId;
          monster.state = 'pursuit';
        }
      }

      // 2. Action selon l'état
      switch (monster.state) {
        case 'idle':
          // Transition aléatoire vers patrouille
          monster.patrolTimer -= deltaMs;
          if (monster.patrolTimer <= 0) {
            monster.state = 'patrol';
            monster.patrolTimer = 2000 + Math.random() * 3000;
            // Choisir un point aléatoire dans le rayon de patrouille
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * monster.patrolRadius;
            monster.targetX = monster.spawnX + Math.cos(angle) * r;
            monster.targetY = monster.spawnY + Math.sin(angle) * r;
          }
          break;

        case 'patrol':
        case 'return':
          // Se déplacer vers targetX, targetY
          const distToTarget = this.getDistance(monster.x, monster.y, monster.targetX, monster.targetY);
          if (distToTarget < 5) {
            monster.state = 'idle';
            monster.patrolTimer = 1000 + Math.random() * 2000;
          } else {
            this.moveTowards(monster, monster.targetX, monster.targetY, deltaSec);
          }
          break;

        case 'pursuit':
          const targetPlayer = this.findPlayerById(monster.targetPlayerId, players);
          if (!targetPlayer || targetPlayer.isDead) {
            monster.state = 'return';
            monster.targetPlayerId = null;
            monster.targetX = monster.spawnX;
            monster.targetY = monster.spawnY;
            break;
          }

          const distToPlayer = this.getDistance(monster.x, monster.y, targetPlayer.x, targetPlayer.y);
          
          // Lâcher l'aggro si le joueur s'éloigne trop du spawn
          const distFromSpawn = this.getDistance(targetPlayer.x, targetPlayer.y, monster.spawnX, monster.spawnY);
          if (distFromSpawn > monster.aggroRange * 1.5) {
            monster.state = 'return';
            monster.targetPlayerId = null;
            monster.targetX = monster.spawnX;
            monster.targetY = monster.spawnY;
            break;
          }

          if (distToPlayer <= monster.attackRange) {
            monster.state = 'attack';
          } else {
            this.moveTowards(monster, targetPlayer.x, targetPlayer.y, deltaSec);
          }
          break;

        case 'attack':
          const tPlayer = this.findPlayerById(monster.targetPlayerId, players);
          if (!tPlayer || tPlayer.isDead) {
            monster.state = 'return';
            monster.targetPlayerId = null;
            break;
          }

          const dToPlayer = this.getDistance(monster.x, monster.y, tPlayer.x, tPlayer.y);
          if (dToPlayer > monster.attackRange) {
            monster.state = 'pursuit';
            break;
          }

          // Attaquer !
          if (monster.canAttack()) {
            this.performAttack(monster, tPlayer);
          }
          break;
      }
    }
  }

  moveTowards(monster, targetX, targetY, deltaSec) {
    const dx = targetX - monster.x;
    const dy = targetY - monster.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 0) {
      monster.x += (dx / dist) * monster.speed * deltaSec;
      monster.y += (dy / dist) * monster.speed * deltaSec;
    }
  }

  findPlayerById(charId, players) {
    for (const [, p] of players.entries()) {
      if (p.charId.toString() === charId.toString()) return p;
    }
    return null;
  }

  performAttack(monster, player) {
    monster.currentAttackCooldown = monster.attackCooldown;
    
    // Pour l'instant on utilise le système de combat pour la déduction HP
    // Ou on le fait directement vu que c'est simple
    const realDamage = player.takeDamage(monster.damage);

    if (this.io) {
      this.io.emit(SOCKET_EVENTS.COMBAT_HIT, {
        attackerId: monster.id,
        targetId: player.charId,
        damage: realDamage,
        targetHp: player.hp,
        targetMaxHp: player.maxHp,
        isSpell: false,
      });

      if (player.isDead) {
        this.io.emit(SOCKET_EVENTS.PLAYER_DIED, {
          playerId: player.charId,
          killedBy: monster.id,
        });
      }
    }
  }
}

export const monsterManager = new MonsterManager();
