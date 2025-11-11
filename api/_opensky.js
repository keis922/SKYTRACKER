// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import axios from "axios";

const openSkyStatesUrl = "https://opensky-network.org/api/states/all";

export async function fetchOpenSkyStates() {
  const { data } = await axios.get(openSkyStatesUrl);
  return data;
}
