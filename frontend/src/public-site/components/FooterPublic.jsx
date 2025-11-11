// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import React from "react";
import { Link } from "react-router-dom";
import SkyTrackerLogo from "../../components/SkyTrackerLogo.jsx";

export default function FooterPublic() {
  return (
    <footer className="relative z-10 border-t border-white/10 bg-black/30">
      <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col gap-6 text-snow/60 text-sm">
        <div className="flex flex-wrap justify-between gap-4">
          <div className="flex items-center gap-3">
            <SkyTrackerLogo size={36} />
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-snow">Sky Tracker</p>
              <p className="text-[11px] text-snow/60">
                Visualisation du trafic aérien mondial en temps réel.
              </p>
            </div>
          </div>
          <div className="flex gap-4 text-[11px] uppercase tracking-[0.3em]">
            <Link to="/map" className="hover:text-snow">
              Carte
            </Link>
            <Link to="/flights" className="hover:text-snow">
              Vols
            </Link>
            <Link to="/login" className="hover:text-snow">
              Compte
            </Link>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] uppercase tracking-[0.35em] text-snow/50">
          <p>© {new Date().getFullYear()} Sky Tracker</p>
          <p>Crédits : KEIS AISSAOUI &amp; TRISTAN HARDOUIN – WebTech 2025 ING4</p>
        </div>
      </div>
    </footer>
  );
}
