import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Character from '../models/Character.js';
import Inventory from '../models/Inventory.js';

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

    const validClasses = ['assassin', 'mage', 'paladin', 'ranger', 'necromancer'];
    if (!validClasses.includes(className)) {
      return res.status(400).json({ error: `Classe invalide. Choix : ${validClasses.join(', ')}` });
    }

    if (!['male', 'female'].includes(sex)) {
      return res.status(400).json({ error: 'Sexe invalide. Choix : male, female' });
    }

    // Stats de base selon la classe
    const classStats = {
      assassin:    { hp: 80,  maxHp: 80,  mana: 40,  maxMana: 40,  strength: 14, dexterity: 16, intelligence: 8,  vitality: 8  },
      mage:        { hp: 70,  maxHp: 70,  mana: 100, maxMana: 100, strength: 6,  dexterity: 8,  intelligence: 18, vitality: 6  },
      paladin:     { hp: 120, maxHp: 120, mana: 40,  maxMana: 40,  strength: 14, dexterity: 6,  intelligence: 10, vitality: 16 },
      ranger:      { hp: 90,  maxHp: 90,  mana: 50,  maxMana: 50,  strength: 10, dexterity: 16, intelligence: 10, vitality: 10 },
      necromancer: { hp: 75,  maxHp: 75,  mana: 90,  maxMana: 90,  strength: 8,  dexterity: 8,  intelligence: 16, vitality: 8  },
    };

    // Créer le personnage
    const character = new Character({
      userId,
      name,
      sex,
      className,
      stats: classStats[className],
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
