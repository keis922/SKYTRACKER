// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import SkyTrackerLogo from "./SkyTrackerLogo.jsx";

function NavLink({ to, label }) {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link
      to={to}
      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
        active
          ? "bg-sky text-night shadow-md shadow-sky/40"
          : "text-snow/70 hover:text-snow hover:bg-white/5"
      }`}
    >
      {label}
    </Link>
  );
}

export default function Header({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-20 border-b border-white/5 bg-night/60 backdrop-blur">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-10 h-16">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-snow/80 transition-colors"
            onClick={onToggleSidebar}
            aria-label="Navigation"
          >
            <span className="block w-4 h-[2px] bg-snow rounded-sm" />
            <span className="block w-4 h-[2px] bg-snow rounded-sm mt-1.5" />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <SkyTrackerLogo size={40} />
            <span className="text-sm sm:text-base font-semibold tracking-wide text-snow">
              Sky Tracker
            </span>
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-2">
          <NavLink to="/" label="Accueil" />
          <NavLink to="/map" label="Carte" />
          <NavLink to="/flights" label="Vols" />
          <NavLink to="/dashboard" label="Tableau de bord" />
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden sm:inline text-xs text-snow/70 max-w-[180px] truncate">
                {user.email}
              </span>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium bg-white/10 hover:bg-white/20 text-snow transition-colors"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium bg-sky text-night shadow-glow hover:bg-sky/90 transition-colors"
            >
              Connexion
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
