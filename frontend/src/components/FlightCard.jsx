// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import React from "react";

const CARD_GRADIENTS = [
  "from-sky-500/80 via-slate-900/80 to-indigo-900/90",
  "from-emerald-500/80 via-slate-900/80 to-cyan-900/90",
  "from-fuchsia-500/80 via-slate-900/80 to-pink-900/90",
  "from-amber-500/80 via-slate-900/80 to-orange-900/90"
];

function getGradient(flight) {
  const seed = (flight?.flightNumber || flight?.flightKey || flight?.id || "0").length;
  return CARD_GRADIENTS[seed % CARD_GRADIENTS.length];
}

function DetailBadge({ label, value }) {
  return (
    <div className="flex flex-col px-3 py-2 rounded-2xl border border-white/10 bg-white/5 min-w-[120px]">
      <span className="text-[10px] uppercase tracking-[0.3em] text-white/60">{label}</span>
      <span className="text-sm font-semibold text-snow truncate">{value || "—"}</span>
    </div>
  );
}

export default function FlightCard({ flight, onToggleFavorite, isFavorite }) {
  const aircraftId = flight.aircraftRegistration || flight.flightKey || flight.id;
  const gradient = getGradient(flight);
  return (
    <div className="grid gap-0 bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-lg shadow-black/50 hover:shadow-2xl transition">
      <div className={`relative aspect-[16/9] overflow-hidden bg-gradient-to-br ${gradient} flex items-center justify-between px-6 py-5`}>
        <div className="text-white/10 text-6xl font-light">✈︎</div>
        <div className="text-white/20 text-8xl font-thin">SKY</div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between text-white gap-4">
          <div className="flex flex-col gap-1 min-w-0">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">{flight.airline || "Compagnie inconnue"}</p>
            <p className="text-2xl font-semibold leading-tight break-words">{flight.flightNumber || "VOL"}</p>
            {aircraftId && <p className="text-[11px] text-white/70 break-all">ID {aircraftId}</p>}
          </div>
          <button
            onClick={() => onToggleFavorite?.(flight)}
            className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-sm transition-colors ${
              isFavorite ? "bg-white text-black shadow-glow" : "bg-black/50 text-white/80 hover:bg-black/70"
            }`}
            aria-label="Favori"
          >
            {isFavorite ? "★" : "☆"}
          </button>
        </div>
        <div className="absolute bottom-4 left-4 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.35em] text-white/70">
          <span className="px-3 py-1 rounded-full bg-black/40 border border-white/20">
            {flight.status ? flight.status.toUpperCase() : "STATUT INCONNU"}
          </span>
        </div>
      </div>
      <div className="px-5 py-5 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 space-y-1">
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/60">Compagnie</p>
            <p className="text-sm font-semibold text-snow">{flight.airline || "Inconnue"}</p>
            <p className="text-[11px] text-white/60">{flight.flightNumber || "Identifiant inconnu"}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 space-y-1">
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/60">Origine</p>
            <p className="text-sm font-semibold text-snow">{flight.originCountry || flight.departureCountry || "Inconnue"}</p>
            <p className="text-[11px] text-white/60">{flight.status || "Terminé"}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] text-snow/70">
          {flight.altitude && <DetailBadge label="Altitude" value={`${Math.round(flight.altitude)} ft`} />}
          {flight.speed && <DetailBadge label="Vitesse" value={`${Math.round(flight.speed)} km/h`} />}
        </div>
      </div>
    </div>
  );
}
