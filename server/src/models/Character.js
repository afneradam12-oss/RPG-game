import mongoose from 'mongoose';

const characterSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 16,
  },
  sex: {
    type: String,
    enum: ['male', 'female'],
    required: true,
  },
  className: {
    type: String,
    enum: ['assassin', 'mage', 'paladin', 'ranger', 'necromancer'],
    required: true,
  },
  level: {
    type: Number,
    default: 1,
    min: 1,
    max: 100,
  },
  xp: {
    type: Number,
    default: 0,
    min: 0,
  },
  stats: {
    hp: { type: Number, default: 100 },
    maxHp: { type: Number, default: 100 },
    mana: { type: Number, default: 50 },
    maxMana: { type: Number, default: 50 },
    strength: { type: Number, default: 10 },
    dexterity: { type: Number, default: 10 },
    intelligence: { type: Number, default: 10 },
    vitality: { type: Number, default: 10 },
  },
  position: {
    x: { type: Number, default: 400 },
    y: { type: Number, default: 300 },
    zone: { type: String, default: 'forest' },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Un joueur ne peut pas avoir deux personnages avec le même nom
characterSchema.index({ userId: 1, name: 1 }, { unique: true });

const Character = mongoose.model('Character', characterSchema);
export default Character;
