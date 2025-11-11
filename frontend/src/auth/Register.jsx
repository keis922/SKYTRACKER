// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useRouteTransition } from "../context/TransitionContext.jsx";

export default function Register() {
  const { register } = useAuth();
  const { triggerTransition } = useRouteTransition();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await register({ email, password, fullName, username });
      triggerTransition();
      setTimeout(() => navigate("/app/dashboard", { replace: true }), 150);
    } catch (caught) {
      setError(caught.message || "Inscription impossible");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-[32px] border border-white/10 bg-gradient-to-b from-white/5 via-white/0 to-white/10 px-6 py-8 sm:px-8 sm:py-10 shadow-[0_25px_70px_rgba(1,3,11,0.65)] backdrop-blur">
      <div className="space-y-2 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-snow/60">
          Espace privé
        </p>
        <h1 className="text-3xl font-semibold text-snow">Créer un compte</h1>
        <p className="text-sm text-snow/60">Accès immédiat au hub utilisateur.</p>
      </div>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-snow/70">Nom complet</label>
          <input
            type="text"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-snow placeholder:text-snow/40 focus:outline-none focus:ring-2 focus:ring-sky/60"
            placeholder="Camille Dupont"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-snow/70">Pseudo</label>
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-snow placeholder:text-snow/40 focus:outline-none focus:ring-2 focus:ring-sky/60"
            placeholder="CapitaineAstre"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-snow/70">Email</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-snow placeholder:text-snow/40 focus:outline-none focus:ring-2 focus:ring-sky/60"
            placeholder="pilote@example.com"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-snow/70">Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-snow placeholder:text-snow/40 focus:outline-none focus:ring-2 focus:ring-sky/60"
            placeholder="••••••••"
          />
        </div>
        {error && <p className="text-xs text-rose-300">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-sky text-night text-sm font-semibold uppercase tracking-[0.35em] py-2.5 shadow-glow disabled:opacity-60"
        >
          Créer mon espace
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-snow/70">
        Déjà inscrit ? <Link to="/login" className="text-snow">Se connecter</Link>
      </p>
    </div>
  );
}
