// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import crypto from "crypto";

export function hashPassword(password) {
  const salt = crypto.randomBytes(8).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 32, "sha256").toString("hex");
  return { salt, hash };
}
