// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import React from "react";
import { Link, NavLink } from "react-router-dom";
import SkyTrackerLogo from "../../components/SkyTrackerLogo.jsx";
import PlanetAvatar from "../../components/PlanetAvatar.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useAvatarSelection } from "../../hooks/useAvatarPreferences.js";

const links = [
  { href: "/", label: "Accueil" },
  { href: "/map", label: "Carte 3D" },
  { href: "/flights", label: "Vols" },
  { href: "/forum", label: "Forum" }
];

export default function HeaderPublic({ showAuthLinks = true }) {
  const { user, profile } = useAuth();
  const [avatarId] = useAvatarSelection(user?.id || user?.email || "");
  const displayName = profile?.username || profile?.full_name || profile?.email;
  return (
    <header className="fixed top-0 left-0 right-0 z-30">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mt-4 flex items-center justify-between rounded-full border border-white/10 bg-black/30 backdrop-blur-xl px-5 py-3">
          <Link to="/" className="flex items-center gap-3 text-snow">
            <SkyTrackerLogo size={40} />
            <span className="text-sm font-semibold tracking-[0.35em] uppercase text-snow">
              Sky Tracker
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-xs uppercase tracking-[0.3em] text-snow/70">
            {links.map((link) => (
              <NavLink
                key={link.href}
                to={link.href}
                className={({ isActive }) =>
                  `transition-colors ${isActive ? "text-snow" : "hover:text-snow"}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          {showAuthLinks && !user && (
            <div className="flex items-center gap-3">
              <NavLink
                to="/login"
                className="text-[11px] uppercase tracking-[0.3em] text-snow/70 hover:text-snow"
              >
                Se connecter
              </NavLink>
              <NavLink
                to="/register"
                className="hidden sm:inline-flex items-center rounded-full bg-sky px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-night shadow-glow"
              >
                Créer un compte
              </NavLink>
            </div>
          )}
          {user && (
            <Link
              to="/app/dashboard"
              className="flex items-center gap-3 rounded-full border border-white/20 bg-transparent px-3 py-1.5 hover:border-sky transition"
            >
              <PlanetAvatar
                variantId={avatarId || "earth"}
                size={40}
                className="h-10 w-10"
              />
              <div className="flex flex-col leading-tight">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-snow">
                  {displayName}
                </span>
                <span className="text-[10px] uppercase tracking-[0.3em] text-snow/60">
                  Accéder au cockpit
                </span>
              </div>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
