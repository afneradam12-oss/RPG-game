import { Router } from 'express';
import { register, login, createCharacter, getCharacters, deleteCharacter } from './authController.js';
import { authMiddleware } from './authMiddleware.js';

const router = Router();

// Routes publiques
router.post('/register', register);
router.post('/login', login);

// Routes protégées (nécessitent un JWT valide)
router.post('/characters', authMiddleware, createCharacter);
router.get('/characters', authMiddleware, getCharacters);

// Supprimer un personnage
router.delete('/characters/:id', authMiddleware, deleteCharacter);

export default router;
