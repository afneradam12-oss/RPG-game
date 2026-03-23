import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import authRoutes from './auth/authRoutes.js';
import { setupSocketHandlers } from './network/SocketHandler.js';

// ============================================
// Configuration
// ============================================

const PORT = process.env.PORT || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// CORS : en dev → autorise localhost Vite ; en prod → même origine (pas besoin)
const corsOrigins = IS_PRODUCTION
  ? []
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

const io = new Server(httpServer, {
  cors: IS_PRODUCTION
    ? {}
    : { origin: corsOrigins, methods: ['GET', 'POST'] },
});

// ============================================
// Middlewares Express
// ============================================

if (!IS_PRODUCTION) {
  app.use(cors({ origin: corsOrigins }));
}
app.use(express.json());

// ============================================
// Routes API
// ============================================

app.use('/api/auth', authRoutes);

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), env: process.env.NODE_ENV || 'development' });
});

// ============================================
// Production : servir le client Vite buildé
// ============================================

if (IS_PRODUCTION) {
  const clientDistPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDistPath));

  // Toute route non-API renvoie index.html (SPA fallback)
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(clientDistPath, 'index.html'));
    }
  });
}

// ============================================
// Socket.io
// ============================================

setupSocketHandlers(io);

// ============================================
// Démarrage
// ============================================

async function start() {
  await connectDB(process.env.MONGODB_URI);

  httpServer.listen(PORT, () => {
    console.log('');
    console.log('🎮 ═══════════════════════════════════════');
    console.log(`🎮  Action-RPG 2D — Serveur démarré`);
    console.log(`🎮  Mode       : ${IS_PRODUCTION ? 'PRODUCTION' : 'DÉVELOPPEMENT'}`);
    console.log(`🎮  Port       : ${PORT}`);
    if (IS_PRODUCTION) {
      console.log(`🎮  Client servi depuis : /client/dist`);
    } else {
      console.log(`🎮  REST API   : http://localhost:${PORT}/api`);
      console.log(`🎮  Socket.io  : ws://localhost:${PORT}`);
    }
    console.log('🎮 ═══════════════════════════════════════');
    console.log('');
  });
}

start().catch((error) => {
  console.error('❌ Erreur fatale au démarrage:', error);
  process.exit(1);
});

export { io };
