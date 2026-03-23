/**
 * Données statiques des Classes du jeu.
 * Partagé entre le Client (pour l'affichage) et le Serveur (pour la validation/création).
 */
export const CLASS_STATS = {
  assassin: {
    name: 'Assassin',
    icon: '🗡️',
    description: 'Rapide et redoutable au corps à corps.',
    stats: { hp: 80, maxHp: 80, mana: 40, maxMana: 40, strength: 14, dexterity: 16, intelligence: 8, vitality: 8 },
    color: '#e74c3c'
  },
  mage: {
    name: 'Mage',
    icon: '🔮',
    description: 'Maître des illusions et des dégâts de zone.',
    stats: { hp: 70, maxHp: 70, mana: 100, maxMana: 100, strength: 6, dexterity: 8, intelligence: 18, vitality: 6 },
    color: '#3498db'
  },
  paladin: {
    name: 'Paladin',
    icon: '🛡️',
    description: 'Guerrier saint extrêmement résistant.',
    stats: { hp: 120, maxHp: 120, mana: 40, maxMana: 40, strength: 14, dexterity: 6, intelligence: 10, vitality: 16 },
    color: '#f39c12'
  },
  ranger: {
    name: 'Ranger',
    icon: '🏹',
    description: 'Expert des attaques à distance.',
    stats: { hp: 90, maxHp: 90, mana: 50, maxMana: 50, strength: 10, dexterity: 16, intelligence: 10, vitality: 10 },
    color: '#2ecc71'
  },
  necromancer: {
    name: 'Nécromancien',
    icon: '💀',
    description: 'Utilise la magie noire pour drainer la vie.',
    stats: { hp: 75, maxHp: 75, mana: 90, maxMana: 90, strength: 8, dexterity: 8, intelligence: 16, vitality: 8 },
    color: '#9b59b6'
  }
};

/**
 * Génère le texte de statistiques formatté pour l'interface de sélection
 */
export function getFormattedStats(className) {
  const charClass = CLASS_STATS[className];
  if (!charClass) return '';
  const s = charClass.stats;
  return `❤️ ${s.hp} HP | 💧 ${s.mana} Mana | ⚔️ ${s.strength} FOR | 🏃 ${s.dexterity} DEX | 🧠 ${s.intelligence} INT | 💪 ${s.vitality} VIT`;
}
