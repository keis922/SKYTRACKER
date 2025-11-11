// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

export async function parseJson(req) {
  if (req.body) {
    try {
      return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    } catch {
      return {};
    }
  }
  return {};
}
