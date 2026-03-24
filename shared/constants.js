// ============================================
// Constantes partagées Client / Serveur
// ============================================

export const TICK_RATE = 20; // Ticks serveur par seconde
export const TICK_INTERVAL = 1000 / TICK_RATE;

// Dimensions
export const TILE_SIZE = 32;
export const MAP_WIDTH_TILES = 50;
export const MAP_HEIGHT_TILES = 50;

// Joueur
export const PLAYER_SPEED = 150; // pixels par seconde
export const PLAYER_BASE_HP = 100;
export const PLAYER_BASE_MANA = 50;

// Combat
export const BASIC_ATTACK_RANGE = 80;       // portée attaque de base (pixels)
export const BASIC_ATTACK_COOLDOWN = 1000;  // cooldown attaque de base (ms)
export const BASIC_ATTACK_DAMAGE = 10;      // dégâts de base
export const RESPAWN_DELAY = 5000;          // délai avant respawn (ms)
export const MANA_REGEN_RATE = 2;           // mana regen par seconde

// Classes
export const CLASSES = {
  ASSASSIN: 'assassin',
  MAGE: 'mage',
  PALADIN: 'paladin',
  RANGER: 'ranger',
  NECROMANCER: 'necromancer',
};

// Niveaux
export const MAX_LEVEL = 100;

// XP requis pour passer au niveau suivant (courbe exponentielle)
export function xpForLevel(level) {
  return Math.floor(100 * Math.pow(level, 1.5));
}

// Réseau
export const SOCKET_EVENTS = {
  // Auth
  AUTHENTICATE: 'authenticate',
  AUTH_SUCCESS: 'auth:success',
  AUTH_ERROR: 'auth:error',

  // Joueur
  PLAYER_INPUT: 'player:input',
  PLAYER_JOIN: 'player:join',
  PLAYER_LEAVE: 'player:leave',

  // Combat
  PLAYER_ATTACK: 'player:attack',
  ATTACK_MONSTER: 'player:attackMonster',
  PLAYER_CAST_SPELL: 'player:castSpell',
  COMBAT_HIT: 'combat:hit',
  PLAYER_DIED: 'player:died',
  PLAYER_RESPAWN: 'player:respawn',

  // Monstres
  MONSTERS_STATE: 'monsters:state',
  MONSTER_DIED: 'monster:died',
  MONSTER_RESPAWN: 'monster:respawn',

  // État du jeu
  GAME_STATE: 'game:state',
  GAME_INIT: 'game:init',
};
