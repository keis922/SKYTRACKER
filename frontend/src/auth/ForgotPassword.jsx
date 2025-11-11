// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("Envoi en cours...");
    try {
      await resetPassword(email);
      setStatus("Lien envoyé. Consulte ta boîte mail.");
    } catch (error) {
      setStatus(error.message || "Impossible d'envoyer l'email");
    }
  }

  return (
    <div className="rounded-[32px] border border-white/10 bg-gradient-to-b from-white/5 via-white/0 to-white/10 px-6 py-8 sm:px-8 sm:py-10 shadow-[0_25px_70px_rgba(1,3,11,0.65)] backdrop-blur">
      <div className="space-y-2 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-snow/60">
          Assistance
        </p>
        <h1 className="text-3xl font-semibold text-snow">Réinitialisation</h1>
        <p className="text-sm text-snow/60">Un lien sécurisé te sera envoyé instantanément.</p>
      </div>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
        <button
          type="submit"
          className="w-full rounded-2xl bg-sky text-night text-sm font-semibold uppercase tracking-[0.35em] py-2.5 shadow-glow"
        >
          Envoyer le lien
        </button>
      </form>
      {status && <p className="mt-4 text-center text-xs text-snow/70">{status}</p>}
      <p className="mt-4 text-center text-sm text-snow/70">
        <Link to="/login" className="text-snow">Retour à la connexion</Link>
      </p>
    </div>
  );
}
