# ⚔️ Realm of Shadows — Action-RPG 2D Coopératif

Un jeu d'action RPG 2D coopératif en ligne, jouable depuis un navigateur web.

## Stack Technique

- **Client** : Phaser 3 + Vite
- **Serveur** : Node.js + Express + Socket.io
- **BDD** : MongoDB + Mongoose
- **Auth** : JWT + bcrypt

## Prérequis

- [Node.js](https://nodejs.org/) v18+
- [MongoDB](https://www.mongodb.com/) (local ou MongoDB Atlas)

## Installation

```bash
# Installer toutes les dépendances (root + client + serveur)
npm install
npm run install:all
```

## Lancement

```bash
# Lancer le client et le serveur simultanément
npm run dev
```

- **Client** : http://localhost:5173
- **API Serveur** : http://localhost:3000/api
- **Health Check** : http://localhost:3000/api/health

## Structure du Projet

```
2D-RPG/
├── client/     # Front-end Phaser 3 + Vite
├── server/     # Back-end Node.js + Express + Socket.io
└── shared/     # Constantes et utilitaires partagés
```
