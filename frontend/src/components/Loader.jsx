// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import React from "react";

export default function Loader() {
  return (
    <div className="flex items-center justify-center py-10">
      <div className="w-9 h-9 rounded-full border-2 border-sky/40 border-t-sky animate-spin" />
    </div>
  );
}

