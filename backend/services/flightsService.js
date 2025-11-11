// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

let flightsCache = [];
let positionsCache = [];

export async function getFlights() {
  return flightsCache;
}

export async function getPositions() {
  return positionsCache;
}

export async function getFlightsForAirport() {
  return { arrivals: [], departures: [] };
}

export async function getTrackForAircraft() {
  return [];
}

export async function getAircraftPhoto() {
  return null;
}

export function initFlightUpdates() {
  flightsCache = [];
}

export function initPositionUpdates() {
  positionsCache = [];
}
