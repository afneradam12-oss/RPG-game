# ⚔️ Étape 1 — Setup Projet & Authentification — Walkthrough

## Résumé

L'Étape 1 du projet Action-RPG 2D est **terminée**. Le projet est structuré en monorepo avec 27 fichiers sources, toutes les dépendances installées.

## Fichiers créés (27 au total)

### Racine
- [package.json](file:///c:/Users/victo/Documents/My%20Games/2D-RPG/package.json) — Script `npm run dev` lance client + serveur
- [README.md](file:///c:/Users/victo/Documents/My%20Games/2D-RPG/README.md)

### Shared (partagé client/serveur)
- [constants.js](file:///c:/Users/victo/Documents/My%20Games/2D-RPG/shared/constants.js) — Tick rate, vitesse, events Socket.io
- [helpers.js](file:///c:/Users/victo/Documents/My%20Games/2D-RPG/shared/helpers.js) — distance, clamp, lerp

### Serveur (`server/`)
| Fichier | Rôle |
|---|---|
| [index.js](file:///c:/Users/victo/Documents/My%20Games/2D-RPG/server/src/index.js) | Point d'entrée — Express + Socket.io + MongoDB |
| [db.js](file:///c:/Users/victo/Documents/My%20Games/2D-RPG/server/src/config/db.js) | Connexion MongoDB |
| [User.js](file:///c:/Users/victo/Documents/My%20Games/2D-RPG/server/src/models/User.js) | Modèle User (hash bcrypt auto) |
| [Character.js](file:///c:/Users/victo/Documents/My%20Games/2D-RPG/server/src/models/Character.js) | Modèle Character (stats, position, classe) |
| [Inventory.js](file:///c:/Users/victo/Documents/My%20Games/2D-RPG/server/src/models/Inventory.js) | Modèle Inventaire (items, équipement, raretés) |
| [authController.js](file:///c:/Users/victo/Documents/My%20Games/2D-RPG/server/src/auth/authController.js) | Register, Login, Create/List Characters |
| [authMiddleware.js](file:///c:/Users/victo/Documents/My%20Games/2D-RPG/server/src/auth/authMiddleware.js) | Vérification JWT |
| [authRoutes.js](file:///c:/Users/victo/Documents/My%20Games/2D-RPG/server/src/auth/authRoutes.js) | Routes `/api/auth/*` |
| [SocketHandler.js](file:///c:/Users/victo/Documents/My%20Games/2D-RPG/server/src/network/SocketHandler.js) | Auth Socket.io (enrichi à l'étape 3) |

### Client (`client/`)
| Fichier | Rôle |
|---|---|
| [main.js](file:///c:/Users/victo/Documents/My%20Games/2D-RPG/client/src/main.js) | Config Phaser 3 (1024×768, arcade physics) |
| [SocketManager.js](file:///c:/Users/victo/Documents/My%20Games/2D-RPG/client/src/network/SocketManager.js) | Singleton Socket.io client |
| [BootScene.js](file:///c:/Users/victo/Documents/My%20Games/2D-RPG/client/src/scenes/BootScene.js) | Barre de chargement + textures placeholder |
| [LoginScene.js](file:///c:/Users/victo/Documents/My%20Games/2D-RPG/client/src/scenes/LoginScene.js) | Formulaire Login/Register avec fond animé |
| [CharacterSelectScene.js](file:///c:/Users/victo/Documents/My%20Games/2D-RPG/client/src/scenes/CharacterSelectScene.js) | Liste personnages + création (classe, stats) |
| [GameScene.js](file:///c:/Users/victo/Documents/My%20Games/2D-RPG/client/src/scenes/GameScene.js) | Map + mouvement ZQSD (local pour l'instant) |
| [UIScene.js](file:///c:/Users/victo/Documents/My%20Games/2D-RPG/client/src/scenes/UIScene.js) | HUD : HP, Mana, XP, barre de sorts |

## Comment tester

### Prérequis
- **MongoDB** doit être lancé localement sur le port 27017

### Lancement
```bash
cd "c:\Users\victo\Documents\My Games\2D-RPG"
npm run dev
```

### Flux de test
1. Ouvrir http://localhost:5173
2. **S'inscrire** (username, email, mot de passe)
3. **Créer un personnage** (nom, sexe, classe)
4. **Jouer** → se déplacer avec ZQSD sur la map

## Prochaine étape

**Étape 2 — Moteur 2D de base** : remplacer les textures placeholder par de vrais sprites/tilemaps créés avec Tiled Map Editor.
