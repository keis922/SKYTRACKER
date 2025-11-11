// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import crypto from "crypto";

export function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return { salt, hash };
}

export function comparePassword(password, salt, hash) {
  const next = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return next === hash;
}

export function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}
