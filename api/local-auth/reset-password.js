// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import { parseJson } from "../_parseJson.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const body = await parseJson(req);
  if (!body.email) {
    res.status(400).json({ error: "Email requis." });
    return;
  }
  res.status(200).json({
    ok: true,
    message: "Si un compte existe pour cet email, les instructions ont été envoyées."
  });
}
