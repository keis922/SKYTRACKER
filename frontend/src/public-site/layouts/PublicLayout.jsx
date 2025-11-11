// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import HeaderPublic from "../components/HeaderPublic.jsx";
import FooterPublic from "../components/FooterPublic.jsx";
import SpaceBackground from "../../components/SpaceBackground.jsx";

export default function PublicLayout() {
  const location = useLocation();
  const showBackground = !location.pathname.startsWith("/map");
  const isMap = location.pathname.startsWith("/map");

  return (
    <div className="relative min-h-screen text-snow bg-transparent">
      {showBackground && <SpaceBackground />}
      {isMap ? (
        <div className="fixed inset-0 bg-transparent pointer-events-none" style={{ zIndex: 0 }} />
      ) : null}
      <HeaderPublic />
      <main className="relative z-10 flex min-h-screen flex-col pt-32">
        <div className="flex-1 pb-16">
          <Outlet />
        </div>
        <FooterPublic />
      </main>
    </div>
  );
}
