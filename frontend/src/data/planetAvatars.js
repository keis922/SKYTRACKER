// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import mercuryTexture from "../assets/planets/mercury.jpg";
import earthTexture from "../assets/planets/earth.jpg";
import marsTexture from "../assets/planets/mars.jpg";
import jupiterTexture from "../assets/planets/jupiter.jpg";
import saturnTexture from "../assets/planets/saturn.jpg";
import saturnRing from "../assets/planets/saturn_ring.png";
import uranusTexture from "../assets/planets/uranus.jpg";
import venusTexture from "../assets/planets/venus.jpg";
import neptuneTexture from "../assets/planets/neptune.jpg";

export const PLANET_AVATARS = [
  {
    id: "mercury",
    label: "Mercure",
    surface: "#9e7b5d",
    glow: "#f2d2b6",
    texture: mercuryTexture,
    cloudTexture: null,
    ring: null,
    rotationSpeed: 0.6
  },
  {
    id: "earth",
    label: "Terre",
    surface: "#0b5394",
    glow: "#87ceeb",
    texture: earthTexture,
    cloudTexture: null,
    ring: null,
    rotationSpeed: 0.45
  },
  {
    id: "mars",
    label: "Mars",
    surface: "#b44c25",
    glow: "#f4a261",
    texture: marsTexture,
    cloudTexture: null,
    ring: null,
    rotationSpeed: 0.35
  },
  {
    id: "jupiter",
    label: "Jupiter",
    surface: "#d4a373",
    glow: "#ffe0b5",
    texture: jupiterTexture,
    cloudTexture: null,
    ring: null,
    rotationSpeed: 0.5
  },
  {
    id: "saturn",
    label: "Saturne",
    surface: "#f2d0a9",
    glow: "#fcdba1",
    texture: saturnTexture,
    cloudTexture: null,
    ring: {
      color: "#f1c27d",
      texture: saturnRing
    },
    rotationSpeed: 0.4
  },
  {
    id: "venus",
    label: "Vénus",
    surface: "#fcd581",
    glow: "#ffecb3",
    texture: venusTexture,
    cloudTexture: null,
    ring: null,
    rotationSpeed: 0.4
  },
  {
    id: "uranus",
    label: "Uranus",
    surface: "#b0f0ff",
    glow: "#a5f3fc",
    texture: uranusTexture,
    cloudTexture: null,
    ring: null,
    rotationSpeed: 0.35
  },
  {
    id: "neptune",
    label: "Neptune",
    surface: "#274690",
    glow: "#70a1ff",
    texture: neptuneTexture,
    cloudTexture: null,
    ring: null,
    rotationSpeed: 0.5
  }
];

export const PLANET_AVATAR_MAP = PLANET_AVATARS.reduce((acc, planet) => {
  acc[planet.id] = planet;
  return acc;
}, {});

export function getPlanetAvatar(variantId) {
  return PLANET_AVATAR_MAP[variantId] || PLANET_AVATARS[0];
}
