// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import axios from "axios";

const openSkyStatesUrl = "https://opensky-network.org/api/states/all";

function buildHeaders() {
  if (process.env.OPENSKY_USERNAME && process.env.OPENSKY_PASSWORD) {
    const auth = Buffer.from(
      `${process.env.OPENSKY_USERNAME}:${process.env.OPENSKY_PASSWORD}`
    ).toString("base64");
    return { Authorization: `Basic ${auth}` };
  }
  return {};
}

export async function fetchOpenSkyStates() {
  const { data } = await axios.get(openSkyStatesUrl, { headers: buildHeaders() });
  return data;
}
