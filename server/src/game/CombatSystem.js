import {
  BASIC_ATTACK_RANGE,
  BASIC_ATTACK_COOLDOWN,
  BASIC_ATTACK_DAMAGE,
  SOCKET_EVENTS,
} from '../../../shared/constants.js';
import { CLASS_SPELLS } from '../../../shared/data/spells.js';

/**
 * CombatSystem — Logique de combat centralisée, 100% côté serveur.
 * Toutes les actions de combat passent ici pour validation.
 */
class CombatSystem {
  constructor() {
    this.io = null;
  }

  setIO(io) {
    this.io = io;
  }

  /**
   * Trouve un PlayerState par son charId parmi tous les joueurs connectés
   */
  findPlayerByCharId(targetId, players) {
    for (const [, player] of players.entries()) {
      if (player.charId.toString() === targetId.toString()) {
        return player;
      }
    }
    return null;
  }

  /**
   * Calcule la distance entre deux joueurs
   */
  getDistance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Attaque de base (clic sur un joueur)
   */
  processAttack(attacker, targetId, players) {
    // Vérifications de sécurité
    if (!attacker || attacker.isDead) return;
    if (!attacker.canAttack()) return;

    // Trouver la cible
    const target = this.findPlayerByCharId(targetId, players);
    if (!target || target.isDead) return;
    if (target.charId.toString() === attacker.charId.toString()) return; // Pas de self-attack

    // Vérifier la portée
    const distance = this.getDistance(attacker, target);
    if (distance > BASIC_ATTACK_RANGE) return;

    // Calculer les dégâts
    const damage = BASIC_ATTACK_DAMAGE + attacker.strength * 0.5;

    // Appliquer
    const realDamage = target.takeDamage(damage);
    attacker.attackCooldown = BASIC_ATTACK_COOLDOWN;

    // Émettre le hit à tous les clients
    if (this.io) {
      this.io.emit(SOCKET_EVENTS.COMBAT_HIT, {
        attackerId: attacker.charId,
        targetId: target.charId,
        damage: realDamage,
        targetHp: target.hp,
        targetMaxHp: target.maxHp,
        isSpell: false,
      });

      // Si la cible est morte
      if (target.isDead) {
        this.io.emit(SOCKET_EVENTS.PLAYER_DIED, {
          playerId: target.charId,
          killedBy: attacker.charId,
        });
      }
    }
  }

  /**
   * Attaque de base sur un Monstre
   */
  processAttackMonster(attacker, monsterId, monsters) {
    if (!attacker || attacker.isDead) return;
    if (!attacker.canAttack()) return;

    const monster = monsters.get(monsterId);
    if (!monster || monster.isDead) return;

    // Vérifier la portée
    const distance = this.getDistance(attacker, monster);
    if (distance > BASIC_ATTACK_RANGE) return;

    // Calculer les dégâts
    const damage = BASIC_ATTACK_DAMAGE + attacker.strength * 0.5;

    // Appliquer
    const realDamage = monster.takeDamage(damage);
    attacker.attackCooldown = BASIC_ATTACK_COOLDOWN;

    // Émettre le hit
    if (this.io) {
      this.io.emit(SOCKET_EVENTS.COMBAT_HIT, {
        attackerId: attacker.charId,
        targetId: monster.id,
        damage: realDamage,
        targetHp: monster.hp,
        targetMaxHp: monster.maxHp,
        isSpell: false,
      });

      // Si le monstre meurt
      if (monster.isDead) {
        this.io.emit(SOCKET_EVENTS.MONSTER_DIED, { id: monster.id });
        
        // Gain d'XP très basique (on améliorera à l'étape 7)
        attacker.xp = (attacker.xp || 0) + monster.xpReward;
        // On devrait update la BDD mais c'est l'étape 7
      }
    }
  }

  /**
   * Lancer un sort (touches 1-2-3-4)
   */
  processSpell(attacker, spellIndex, targetId, players) {
    // Vérifications de sécurité
    if (!attacker || attacker.isDead) return;
    if (!attacker.canCastSpell(spellIndex)) return;

    // Récupérer le sort
    const spells = CLASS_SPELLS[attacker.className];
    if (!spells || !spells[spellIndex]) return;
    const spell = spells[spellIndex];

    // Trouver la cible
    const target = this.findPlayerByCharId(targetId, players);
    if (!target || target.isDead) return;
    if (target.charId.toString() === attacker.charId.toString()) return;

    // Vérifier la portée
    const distance = this.getDistance(attacker, target);
    if (distance > spell.range) return;

    // Calculer les dégâts (scale avec la stat appropriée)
    const statValue = attacker[spell.scaleStat] || 10;
    const damage = spell.damage + statValue * (spell.scaleRatio || 0.3);

    // Consommer le mana et appliquer le cooldown
    attacker.consumeMana(spell.manaCost);
    attacker.spellCooldowns[spellIndex] = spell.cooldown;

    // Appliquer les dégâts
    const realDamage = target.takeDamage(damage);

    // Effet spécial : lifesteal (Nécromancien)
    if (spell.special === 'lifesteal' && spell.lifestealRatio) {
      const healAmount = Math.round(realDamage * spell.lifestealRatio);
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + healAmount);
    }

    // Émettre le hit
    if (this.io) {
      this.io.emit(SOCKET_EVENTS.COMBAT_HIT, {
        attackerId: attacker.charId,
        targetId: target.charId,
        damage: realDamage,
        targetHp: target.hp,
        targetMaxHp: target.maxHp,
        isSpell: true,
        spellName: spell.name,
        spellIcon: spell.icon,
      });

      // Si la cible est morte
      if (target.isDead) {
        this.io.emit(SOCKET_EVENTS.PLAYER_DIED, {
          playerId: target.charId,
          killedBy: attacker.charId,
        });
      }
    }
  }

  /**
   * Lancer un sort sur un Monstre
   */
  processSpellOnMonster(attacker, spellIndex, monsterId, monsters) {
    if (!attacker || attacker.isDead) return;
    if (!attacker.canCastSpell(spellIndex)) return;

    const spells = CLASS_SPELLS[attacker.className];
    if (!spells || !spells[spellIndex]) return;
    const spell = spells[spellIndex];

    const monster = monsters.get(monsterId);
    if (!monster || monster.isDead) return;

    // Vérifier la portée
    const distance = this.getDistance(attacker, monster);
    if (distance > spell.range) return;

    // Dégâts
    const statValue = attacker[spell.scaleStat] || 10;
    const damage = spell.damage + statValue * (spell.scaleRatio || 0.3);

    attacker.consumeMana(spell.manaCost);
    attacker.spellCooldowns[spellIndex] = spell.cooldown;

    const realDamage = monster.takeDamage(damage);

    if (spell.special === 'lifesteal' && spell.lifestealRatio) {
      const healAmount = Math.round(realDamage * spell.lifestealRatio);
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + healAmount);
    }

    if (this.io) {
      this.io.emit(SOCKET_EVENTS.COMBAT_HIT, {
        attackerId: attacker.charId,
        targetId: monster.id,
        damage: realDamage,
        targetHp: monster.hp,
        targetMaxHp: monster.maxHp,
        isSpell: true,
        spellName: spell.name,
        spellIcon: spell.icon,
      });

      if (monster.isDead) {
        this.io.emit(SOCKET_EVENTS.MONSTER_DIED, { id: monster.id });
      }
    }
  }

  /**
   * Met à jour les cooldowns de tous les joueurs (appelé chaque tick)
   */
  updateCooldowns(players, deltaMs) {
    for (const [, player] of players.entries()) {
      player.updateCooldowns(deltaMs);
    }
  }

  /**
   * Gère le respawn automatique des joueurs morts
   */
  handleRespawns(players, deltaMs) {
    for (const [, player] of players.entries()) {
      if (player.isDead && player.respawnTimer <= 0) {
        player.respawn();

        if (this.io) {
          this.io.emit(SOCKET_EVENTS.PLAYER_RESPAWN, {
            playerId: player.charId,
            x: Math.round(player.x),
            y: Math.round(player.y),
          });
        }
      }
    }
  }

  /**
   * Regen le mana de tous les joueurs (appelé chaque tick)
   */
  regenMana(players, deltaSeconds) {
    for (const [, player] of players.entries()) {
      player.regenMana(deltaSeconds);
    }
  }
}

// Singleton
export const combatSystem = new CombatSystem();
