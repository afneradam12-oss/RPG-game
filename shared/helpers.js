// ============================================
// Fonctions utilitaires partagées
// ============================================

/**
 * Calcule la distance entre deux points
 */
export function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * Clamp une valeur entre min et max
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Interpolation linéaire
 */
export function lerp(start, end, t) {
  return start + (end - start) * t;
}
