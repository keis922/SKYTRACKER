// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import * as THREE from "three";

const START_COLOR = new THREE.Color("#fb923c");
const END_COLOR = new THREE.Color("#ec4899");
const MAX_ALTITUDE = 12000;

export function altitudeToColor(altitudeMeters = 0) {
  const ratio = Math.min(Math.max(altitudeMeters, 0), MAX_ALTITUDE) / MAX_ALTITUDE;
  const color = START_COLOR.clone().lerp(END_COLOR, ratio);
  return `#${color.getHexString()}`;
}
