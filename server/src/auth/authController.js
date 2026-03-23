import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Character from '../models/Character.js';
import Inventory from '../models/Inventory.js';
import { CLASS_STATS } from '../../../shared/data/classes.js';

/**
 * Inscription d'un nouveau joueur
 * POST /api/auth/register
 */
export async function register(req, res) {
  try {
    const { username, email, password } = req.body;

    // Validation des champs
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Tous les champs sont requis (username, email, password)' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit faire au moins 6 caractères' });
    }

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: 'Le nom d\'utilisateur doit faire entre 3 et 20 caractères' });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Cet email ou nom d\'utilisateur est déjà utilisé' });
    }

    // Créer l'utilisateur (le hash du mot de passe est fait par le pre-save hook)
    const user = new User({ username, email, password });
    await user.save();

    // Générer le token JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    console.log(`✅ Nouveau joueur inscrit : ${username}`);

    res.status(201).json({
      message: 'Inscription réussie',
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Erreur register:', error);
    res.status(500).json({ error: 'Erreur serveur lors de l\'inscription' });
  }
}

/**
 * Connexion d'un joueur existant
 * POST /api/auth/login
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    // Trouver l'utilisateur par email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Vérifier le mot de passe
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Récupérer les personnages du joueur
    const characters = await Character.find({ userId: user._id });

    // Générer le token JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    console.log(`✅ Joueur connecté : ${user.username}`);

    res.json({
      message: 'Connexion réussie',
      token,
      user: user.toJSON(),
      characters,
    });
  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la connexion' });
  }
}

/**
 * Création d'un personnage
 * POST /api/auth/characters
 */
export async function createCharacter(req, res) {
  try {
    const { name, sex, className } = req.body;
    const userId = req.userId;

    // Validation
    if (!name || !sex || !className) {
      return res.status(400).json({ error: 'Nom, sexe et classe requis' });
    }

    const validClasses = Object.keys(CLASS_STATS);
    if (!validClasses.includes(className)) {
      return res.status(400).json({ error: `Classe invalide. Choix : ${validClasses.join(', ')}` });
    }

    if (!['male', 'female'].includes(sex)) {
      return res.status(400).json({ error: 'Sexe invalide. Choix : male, female' });
    }

    // Créer le personnage
    const character = new Character({
      userId,
      name,
      sex,
      className,
      stats: CLASS_STATS[className].stats,
    });
    await character.save();

    // Créer l'inventaire vide associé
    const inventory = new Inventory({ characterId: character._id });
    await inventory.save();

    console.log(`✅ Personnage créé : ${name} (${className})`);

    res.status(201).json({
      message: 'Personnage créé',
      character,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Vous avez déjà un personnage avec ce nom' });
    }
    console.error('Erreur createCharacter:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la création du personnage' });
  }
}

/**
 * Liste des personnages du joueur
 * GET /api/auth/characters
 */
export async function getCharacters(req, res) {
  try {
    const characters = await Character.find({ userId: req.userId });
    res.json({ characters });
  } catch (error) {
    console.error('Erreur getCharacters:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}
/**
 * Supprimer un personnage
 * DELETE /api/auth/characters/:id
 */
export async function deleteCharacter(req, res) {
  try {
    const characterId = req.params.id;
    const userId = req.userId;

    // Vérifier que le personnage appartient bien au joueur
    const character = await Character.findOne({ _id: characterId, userId });
    
    if (!character) {
      return res.status(404).json({ error: 'Personnage introuvable ou vous n\'en êtes pas le propriétaire' });
    }

    // Supprimer l'inventaire associé
    await Inventory.deleteOne({ characterId });
    
    // Supprimer le personnage
    await Character.deleteOne({ _id: characterId });

    console.log(`🗑️ Personnage supprimé : ${character.name}`);
    
    res.json({ message: 'Personnage supprimé avec succès' });
  } catch (error) {
    console.error('Erreur deleteCharacter:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression' });
  }
}
