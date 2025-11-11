// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import SpaceBackground from "../../components/SpaceBackground.jsx";
import FooterPublic from "../../public-site/components/FooterPublic.jsx";
import AppHeader from "../components/AppHeader.jsx";

export default function DashboardLayout() {
  const location = useLocation();
  const isSettings = location.pathname.startsWith("/app/settings");

  return (
    <div className="relative min-h-screen text-snow bg-transparent">
      <SpaceBackground />
      <AppHeader />
      <main className="relative z-10 flex min-h-screen flex-col pt-44 sm:pt-48">
        <div className="flex-1 px-4 pb-16 sm:px-6">
          <div className={`max-w-6xl mx-auto ${isSettings ? "" : "backdrop-blur-sm"}`}>
            <Outlet />
          </div>
        </div>
        <FooterPublic />
      </main>
    </div>
  );
}
