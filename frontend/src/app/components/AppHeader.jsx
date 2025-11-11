// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import React, { useMemo } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import SkyTrackerLogo from "../../components/SkyTrackerLogo.jsx";

export default function AppHeader() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const navLinks = useMemo(() => {
    const base = [
      { to: "/app/dashboard", label: "Dashboard" },
      { to: "/app/my-flights", label: "Mes vols" },
      { to: "/app/forum", label: "Forum" },
      { to: "/app/settings", label: "Paramètres" }
    ];
    if ((profile?.role || "").toLowerCase() === "admin") {
      base.splice(2, 0, { to: "/app/admin", label: "Admin" });
    }
    return base;
  }, [profile?.role]);

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-30">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mt-4 flex flex-wrap items-center gap-4 rounded-full border border-white/10 bg-black/35 backdrop-blur-2xl px-5 py-3">
          <Link to="/" className="flex items-center gap-3 text-snow">
            <SkyTrackerLogo size={38} />
            <span className="text-sm font-semibold tracking-[0.35em] uppercase text-snow">
              Sky Tracker
            </span>
          </Link>
          <nav className="flex flex-1 flex-wrap items-center justify-center gap-4 text-[10px] uppercase tracking-[0.3em] text-snow/70">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-full px-3 py-1 transition ${
                    isActive ? "bg-white/10 text-snow" : "hover:text-snow"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.25em] text-snow/70">
            <div className="hidden sm:flex flex-col text-right text-[10px] leading-tight">
              <span className="text-snow text-xs font-semibold">
                {profile?.full_name || "Compte"}
              </span>
              <span className="text-white/60">{profile?.email}</span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-white/30 bg-white/10 px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-snow hover:bg-white/20"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
