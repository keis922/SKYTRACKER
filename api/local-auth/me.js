// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import { getUserFromToken } from "../_authService.js";

export default async function handler(req, res) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const user = await getUserFromToken(token);
  if (!user) {
    res.status(401).json({ error: "Non authentifié." });
    return;
  }

  if (req.method === "GET") {
    res.status(200).json({ user });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
