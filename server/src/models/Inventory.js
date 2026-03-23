import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  characterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Character',
    required: true,
    unique: true,
  },
  items: [
    {
      itemId: { type: String, required: true },
      name: { type: String, required: true },
      type: {
        type: String,
        enum: ['weapon', 'armor', 'helmet', 'boots', 'accessory', 'consumable', 'material'],
        required: true,
      },
      quantity: { type: Number, default: 1, min: 1 },
      stats: {
        strength: { type: Number, default: 0 },
        dexterity: { type: Number, default: 0 },
        intelligence: { type: Number, default: 0 },
        vitality: { type: Number, default: 0 },
      },
      rarity: {
        type: String,
        enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
        default: 'common',
      },
    },
  ],
  equipped: {
    weapon: { type: mongoose.Schema.Types.Mixed, default: null },
    armor: { type: mongoose.Schema.Types.Mixed, default: null },
    helmet: { type: mongoose.Schema.Types.Mixed, default: null },
    boots: { type: mongoose.Schema.Types.Mixed, default: null },
    accessory: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  maxSlots: {
    type: Number,
    default: 30,
  },
});

const Inventory = mongoose.model('Inventory', inventorySchema);
export default Inventory;
