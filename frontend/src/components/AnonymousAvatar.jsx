// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import React from "react";

export default function AnonymousAvatar({ size = 56, className = "" }) {
  return (
    <div
      className={`relative rounded-full overflow-hidden border border-white/20 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 shadow-[0_10px_25px_rgba(0,0,0,0.35)] ${className}`}
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.25),transparent_45%)]" />
      <svg
        viewBox="0 0 64 64"
        className="absolute inset-0 m-auto text-white/85 drop-shadow-[0_4px_10px_rgba(0,0,0,0.45)]"
        width={size * 0.65}
        height={size * 0.65}
      >
        <path
          d="M32 10c6.6 0 12 5.4 12 12s-5.4 12-12 12-12-5.4-12-12S25.4 10 32 10Zm0 28c8.8 0 16 4.8 16 10.6 0 1-.9 1.9-1.9 1.9H17.9c-1 0-1.9-.9-1.9-1.9C16 42.8 23.2 38 32 38Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}
