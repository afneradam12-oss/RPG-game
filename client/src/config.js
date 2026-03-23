// ============================================
// Configuration client — URLs serveur
// ============================================
// En dev  : http://localhost:3000 (serveur local séparé)
// En prod : même origine (le serveur sert le client)

const IS_PRODUCTION = import.meta.env.PROD;
const SERVER_URL = IS_PRODUCTION
  ? ''  // Même origine en prod (Render sert tout depuis le même service)
  : (import.meta.env.VITE_SERVER_URL || 'http://localhost:3000');

export const API_URL = `${SERVER_URL}/api/auth`;
export const SOCKET_URL = IS_PRODUCTION
  ? window.location.origin  // Socket.io se connecte au même host en prod
  : (import.meta.env.VITE_SERVER_URL || 'http://localhost:3000');
