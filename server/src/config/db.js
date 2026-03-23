import mongoose from 'mongoose';

/**
 * Connexion à MongoDB
 */
export async function connectDB(uri) {
  try {
    await mongoose.connect(uri);
    console.log('✅ MongoDB connecté avec succès');
  } catch (error) {
    console.error('❌ Erreur connexion MongoDB:', error.message);
    process.exit(1);
  }
}
