// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import { fetchOpenSkyStates } from "./_opensky.js";

export default async function handler(req, res) {
  const payload = await fetchOpenSkyStates();
  res.status(200).json({ positions: payload?.states || [], time: payload?.time });
}
