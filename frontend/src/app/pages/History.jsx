// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import React, { useMemo, useState } from "react";
import { useFavorites } from "../../hooks/useFavorites.js";

const sorters = {
  date: (a, b) => new Date(b.created_at) - new Date(a.created_at),
  compagnie: (a, b) => (a.airline || "").localeCompare(b.airline || "", "fr"),
  statut: (a, b) => (a.status || "").localeCompare(b.status || "", "fr")
};

function formatCoords(lat, lon) {
  if (lat == null || lon == null) {
    return "Coordonnées indisponibles";
  }
  return `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
}

function formatMoment(value) {
  if (!value) {
    return "Date inconnue";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function History() {
  const { favorites, loading } = useFavorites(true);
  const [sortBy, setSortBy] = useState("date");
  const archived = useMemo(() => favorites.filter((fav) => !fav.is_active), [favorites]);
  const sorted = useMemo(() => archived.slice().sort(sorters[sortBy] || sorters.date), [archived, sortBy]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-snow/60">Historique</p>
          <h1 className="text-2xl font-semibold text-snow">Timeline des vols archivés</h1>
        </div>
        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
          className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-snow/80"
        >
          <option value="date">Date</option>
          <option value="compagnie">Compagnie</option>
          <option value="statut">Statut</option>
        </select>
      </div>
      <div className="rounded-3xl border border-white/10 bg-black/30 p-6 shadow-[0_25px_70px_rgba(1,3,11,0.6)] backdrop-blur">
        {loading ? (
          <p className="text-sm text-snow/60">Synchronisation...</p>
        ) : sorted.length === 0 ? (
          <p className="text-sm text-snow/60">Aucun historique pour le moment.</p>
        ) : (
          <ol className="relative border-l-2 border-white/20 pl-6 space-y-6">
            {sorted.map((favorite, index) => {
              const code = favorite.flight_number || favorite.flight_id;
              return (
                <li key={favorite.id} className="relative">
                  <span className="absolute -left-[37px] flex h-6 w-6 items-center justify-center rounded-full border-2 border-white/40 bg-black/70 text-white text-xs font-semibold">
                    {String(sorted.length - index).padStart(2, "0")}
                  </span>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-snow">
                    <div className="flex flex-wrap justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-snow/60">
                          {favorite.airline || "Compagnie inconnue"}
                        </p>
                        <p className="text-xl font-semibold text-snow">{code}</p>
                        <p className="text-sm text-snow/70">{favorite.status || "Terminé"}</p>
                      </div>
                      <div className="text-right text-sm text-snow/60">
                        <p>{formatMoment(favorite.created_at)}</p>
                        <p>{favorite.departure_airport || favorite.arrival_airport || "Route inconnue"}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3 text-xs text-snow/70">
                      <span className="rounded-full bg-white/10 px-3 py-1">
                        {favorite.is_active ? "Actif" : "Archivé"}
                      </span>
                      {favorite.latitude != null && favorite.longitude != null && (
                        <span className="rounded-full bg-white/10 px-3 py-1">
                          {formatCoords(favorite.latitude, favorite.longitude)}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
