// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useRouteTransition } from "../context/TransitionContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const { triggerTransition } = useRouteTransition();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(identifier, password);
      triggerTransition();
      const redirect = location.state?.from?.pathname || "/app/dashboard";
      setTimeout(() => navigate(redirect, { replace: true }), 150);
    } catch (caught) {
      const apiError =
        caught?.response?.data?.error ||
        caught?.response?.data?.message ||
        caught?.message;
      setError(apiError || "Identifiants incorrects.");
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
        <h1 className="text-3xl font-semibold text-snow">Connexion</h1>
        <p className="text-sm text-snow/60">Accédez directement au cockpit personnalisé.</p>
      </div>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-snow/70">Email ou pseudo</label>
          <input
            type="text"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            required
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-snow placeholder:text-snow/40 focus:outline-none focus:ring-2 focus:ring-sky/60"
            placeholder="pilote@example.com ou CapitaineAstre"
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
          Se connecter
        </button>
      </form>
      <div className="mt-4 space-y-2 text-center text-sm text-snow/70">
        <Link to="/forgot-password" className="text-snow">
          Mot de passe oublié ?
        </Link>
        <p>
          Pas encore de compte ? <Link to="/register" className="text-snow">Créer un accès</Link>
        </p>
      </div>
    </div>
  );
}
