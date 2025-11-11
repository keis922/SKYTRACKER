// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import React from "react";
import { Outlet } from "react-router-dom";
import SpaceBackground from "../components/SpaceBackground.jsx";
import HeaderPublic from "../public-site/components/HeaderPublic.jsx";

export default function AuthPublicLayout() {
  return (
    <div className="relative min-h-screen text-snow bg-transparent">
      <SpaceBackground />
      <HeaderPublic showAuthLinks={false} />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 pt-32 pb-16">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
