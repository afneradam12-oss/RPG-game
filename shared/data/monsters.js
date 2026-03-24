/**
 * Données statiques des monstres du jeu.
 * Partagé entre Client (affichage) et Serveur (spawn, IA, combat).
 * 
 * Chaque type de monstre :
 * - name, icon, spriteKey : identité visuelle
 * - hp, damage, defense : stats de combat
 * - speed : vitesse de déplacement (pixels/s)
 * - aggroRange : distance à laquelle le monstre détecte un joueur (pixels)
 * - attackRange : portée d'attaque (pixels)
 * - attackCooldown : délai entre 2 attaques (ms)
 * - xpReward : XP donné à la mort
 * - level : niveau requis recommandé
 * - spawnZone : zone de la map où il apparaît
 * - patrolRadius : rayon de patrouille autour du point de spawn (pixels)
 * - respawnTime : temps avant réapparition (ms)
 */
export const MONSTER_TYPES = {
  slime: {
    name: 'Slime',
    icon: '🟢',
    spriteKey: 'monster_slime',
    hp: 40,
    damage: 5,
    defense: 1,
    speed: 40,
    aggroRange: 150,
    attackRange: 50,
    attackCooldown: 2000,
    xpReward: 15,
    level: 1,
    patrolRadius: 80,
    respawnTime: 15000,
  },
  wolf: {
    name: 'Loup',
    icon: '🐺',
    spriteKey: 'monster_wolf',
    hp: 70,
    damage: 10,
    defense: 2,
    speed: 80,
    aggroRange: 200,
    attackRange: 60,
    attackCooldown: 1500,
    xpReward: 30,
    level: 3,
    patrolRadius: 120,
    respawnTime: 20000,
  },
  skeleton: {
    name: 'Squelette',
    icon: '💀',
    spriteKey: 'monster_skeleton',
    hp: 100,
    damage: 14,
    defense: 4,
    speed: 55,
    aggroRange: 180,
    attackRange: 70,
    attackCooldown: 1800,
    xpReward: 50,
    level: 5,
    patrolRadius: 100,
    respawnTime: 25000,
  },
  goblin: {
    name: 'Gobelin',
    icon: '👺',
    spriteKey: 'monster_goblin',
    hp: 60,
    damage: 12,
    defense: 3,
    speed: 70,
    aggroRange: 220,
    attackRange: 55,
    attackCooldown: 1200,
    xpReward: 40,
    level: 4,
    patrolRadius: 100,
    respawnTime: 18000,
  },
};

/**
 * Configuration des spawns de monstres sur la map.
 * Chaque entrée définit un point de spawn avec le type et la position.
 */
export const MONSTER_SPAWNS = [
  // ── Zone de départ (Slimes faciles) ──
  { type: 'slime', x: 200, y: 200 },
  { type: 'slime', x: 350, y: 150 },
  { type: 'slime', x: 500, y: 250 },
  { type: 'slime', x: 150, y: 400 },
  { type: 'slime', x: 600, y: 350 },

  // ── Zone intermédiaire (Loups + Gobelins) ──
  { type: 'wolf', x: 800, y: 400 },
  { type: 'wolf', x: 900, y: 550 },
  { type: 'wolf', x: 1000, y: 350 },
  { type: 'goblin', x: 850, y: 700 },
  { type: 'goblin', x: 1100, y: 500 },
  { type: 'goblin', x: 750, y: 600 },

  // ── Zone dangereuse (Squelettes) ──
  { type: 'skeleton', x: 1200, y: 800 },
  { type: 'skeleton', x: 1350, y: 700 },
  { type: 'skeleton', x: 1100, y: 900 },
  { type: 'skeleton', x: 1400, y: 1000 },
];
