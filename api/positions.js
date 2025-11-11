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
  const states = Array.isArray(payload?.states) ? payload.states : [];
  const positions = states.map((row) => ({
    icao24: row[0] || null,
    callsign: (row[1] || "").trim(),
    originCountry: row[2] || "",
    timePosition: row[3],
    lastContact: row[4],
    longitude: row[5],
    latitude: row[6]
  }));
  res.status(200).json({ positions, time: payload?.time });
}
