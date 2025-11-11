// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import React from "react";
import { Link, useLocation } from "react-router-dom";

function Item({ to, label, onClick }) {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
        active
          ? "bg-sky text-night shadow-glow"
          : "bg-white/5 text-snow/80 hover:bg-white/10 hover:text-snow"
      }`}
    >
      <span>{label}</span>
      <span className="w-2 h-2 rounded-full bg-sky/70 shadow-glow" />
    </Link>
  );
}

export default function Sidebar({ open, onClose }) {
  return (
    <>
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-night/95 border-r border-white/10 backdrop-blur-lg transform transition-transform duration-300 ease-out z-30
        ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static md:z-0`}
      >
        <div className="h-16 border-b border-white/5 px-4 flex items-center text-xs font-semibold tracking-[0.2em] uppercase text-snow/60">
          Navigation
        </div>
        <div className="px-4 py-4 space-y-3">
          <Item to="/" label="Carte en temps réel" onClick={onClose} />
          <Item to="/flights" label="Tous les vols" onClick={onClose} />
          <Item to="/dashboard" label="Tableau de bord" onClick={onClose} />
        </div>
        <div className="absolute bottom-4 inset-x-4">
          <div className="px-4 py-3 rounded-xl bg-gradient-to-br from-sky/20 via-sky/10 to-transparent border border-sky/40 shadow-glow">
            <p className="text-[11px] leading-snug text-snow/80">
              Suivez les vols commerciaux du monde entier avec une vue claire et fluide.
            </p>
          </div>
        </div>
      </div>
      {open && (
        <button
          className="fixed inset-0 bg-black/40 backdrop-blur-sm md:hidden z-20"
          onClick={onClose}
          aria-label="Fermer la navigation"
        />
      )}
    </>
  );
}

