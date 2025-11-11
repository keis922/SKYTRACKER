// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useFavorites } from "../../hooks/useFavorites.js";
import Globe from "../../components/Globe.jsx";
import { useFlightsStore } from "../../store/useFlightsStore.js";

function StatCard({ label, value, accent }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 shadow-[0_15px_40px_rgba(1,3,11,0.4)] text-snow">
      <p className="text-xs uppercase tracking-[0.35em] text-snow/60">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-snow">{value}</p>
      {accent && <p className="text-xs text-snow/50 mt-1">{accent}</p>}
    </div>
  );
}

function formatDate(value) {
  if (!value) {
    return "Date inconnue";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatCoords(lat, lon) {
  if (lat == null || lon == null) {
    return "Coordonnées indisponibles";
  }
  return `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
}

export default function DashboardHome() {
  const { profile } = useAuth();
  const { favorites, loading } = useFavorites(true);
  const selectFlight = useFlightsStore((state) => state.selectFlight);
  const flights = useFlightsStore((state) => state.flights);
  const navigate = useNavigate();

  const activeFavorites = useMemo(() => favorites.filter((fav) => fav.is_active), [favorites]);
  const favoriteIdentifiers = useMemo(
    () =>
      favorites
        .flatMap((fav) => [fav.flight_id, fav.flight_number, fav.flight_icao])
        .filter(Boolean)
        .map((value) => value.trim().toUpperCase()),
    [favorites]
  );
  const activeFlight = activeFavorites[0] || null;
  const lastFavorites = useMemo(() => favorites.slice(0, 4), [favorites]);
  const recentCount = useMemo(() => {
    const limit = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return favorites.filter((fav) => {
      if (!fav.created_at) {
        return false;
      }
      const ts = new Date(fav.created_at).getTime();
      return Number.isFinite(ts) && ts >= limit;
    }).length;
  }, [favorites]);

  const stats = [
    { label: "Vols suivis", value: favorites.length, accent: "Total synchronisé" },
    {
      label: "Actifs",
      value: activeFavorites.length,
      accent: "Surveillance en direct"
    },
    {
      label: "Ajouts 7 j",
      value: recentCount,
      accent: "Dernières synchronisations"
    }
  ];

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/10 bg-black/30 p-6 shadow-[0_25px_70px_rgba(1,3,11,0.6)] backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-snow/60">Carte personnelle</p>
            <h1 className="text-2xl font-semibold text-snow">
              {profile?.full_name || "Pilote"}, voici tes vols suivis.
            </h1>
          </div>
          <button
            type="button"
            onClick={() => navigate("/app/my-flights")}
            className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-snow/80 hover:text-snow"
          >
            Gérer
          </button>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="h-[360px] rounded-[32px] border border-white/10 bg-black/60 overflow-hidden">
            <Globe
              className="w-full h-full"
              canvasClassName="w-full h-full"
              cameraPosition={[0, 0, 5.2]}
              fov={34}
              minDistance={2.4}
              maxDistance={7}
              syncBackground
              introAnimation
              introKey="dashboard-globe"
              showTrack
              flightLayerOptions={{
                clickable: true,
                maxItems: favorites.length > 0 ? favorites.length : 200,
                filterFlightIds: favoriteIdentifiers
              }}
            />
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-snow/80 space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-snow/60">Favoris</p>
              <p className="text-lg font-semibold text-snow">
                {favorites.length > 0
                  ? "Clique sur un favori pour afficher sa trajectoire"
                  : "Ajoute des vols pour les visualiser ici"}
              </p>
            </div>
            <div className="max-h-[260px] overflow-y-auto divide-y divide-white/10">
              {favorites.length === 0 && (
                <p className="text-sm text-snow/60">
                  Aucun favori pour le moment. Ajoute un vol depuis la carte publique ou depuis "Mes vols".
                </p>
              )}
              {favorites.map((favorite) => (
                <button
                  key={favorite.id}
                  type="button"
                  onClick={() => {
                    const identifiers = [favorite.flight_id, favorite.flight_number]
                      .filter(Boolean)
                      .map((value) => value.trim().toUpperCase());
                    const match = flights.find((flight) => {
                      const options = [
                        flight.id,
                        flight.icao24,
                        flight.callsign,
                        flight.flight_iata
                      ]
                        .filter(Boolean)
                        .map((value) => value.trim().toUpperCase());
                      return options.some((value) => identifiers.includes(value));
                    });
                    if (match) {
                      selectFlight(match);
                    }
                  }}
                  className="flex w-full items-center justify-between gap-4 px-3 py-2 text-left text-snow hover:bg-white/10"
                >
                  <div>
                    <p className="text-sm font-semibold text-snow">
                      {favorite.flight_number || favorite.flight_id}
                    </p>
                    <p className="text-[11px] text-snow/60">
                      {favorite.airline || "Compagnie inconnue"} • {favorite.status || "Terminé"}
                    </p>
                  </div>
                  <span className="text-[11px] text-snow/60">{formatCoords(favorite.latitude, favorite.longitude)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="rounded-3xl border border-white/10 bg-black/30 p-6 shadow-[0_25px_70px_rgba(1,3,11,0.6)] backdrop-blur">
          <p className="text-xs uppercase tracking-[0.35em] text-snow/60">Vue d'ensemble</p>
          <h1 className="mt-2 text-2xl font-semibold text-snow">
            {profile?.full_name || "Pilote"}, voici l'activité du jour.
          </h1>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {stats.map((stat) => (
              <StatCard key={stat.label} label={stat.label} value={stat.value} accent={stat.accent} />
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-sky/10 via-black/40 to-black/80 text-white p-6 shadow-[0_25px_70px_rgba(2,6,23,0.75)]">
          <p className="text-xs uppercase tracking-[0.35em] text-white/60">Vol actif</p>
          {activeFlight ? (
            <div className="mt-4 space-y-3">
              <p className="text-4xl font-semibold">
                {activeFlight.flight_number || activeFlight.flight_id}
              </p>
              <p className="text-sm text-white/70">{activeFlight.airline || "Compagnie inconnue"}</p>
              <div className="grid grid-cols-2 gap-3 text-xs text-white/70">
                <div className="rounded-2xl bg-white/10 px-3 py-2">
                  <p className="uppercase tracking-[0.3em] text-[10px] text-white/60">Statut</p>
                  <p className="mt-1 text-sm text-white">
                    {activeFlight.status || "Non renseigné"}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/10 px-3 py-2">
                  <p className="uppercase tracking-[0.3em] text-[10px] text-white/60">Coordonnées</p>
                  <p className="mt-1 text-sm text-white">
                    {formatCoords(activeFlight.latitude, activeFlight.longitude)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate("/app/my-flights")}
                className="mt-4 inline-flex items-center rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-900"
              >
                Gérer mes vols
              </button>
            </div>
          ) : (
            <div className="mt-4 text-slate-300 text-sm">
              Aucun vol n'est actif. Activez un favori pour suivre sa progression.
            </div>
          )}
        </div>
      </section>
      <section className="rounded-3xl border border-white/10 bg-black/30 p-6 shadow-[0_25px_70px_rgba(1,3,11,0.6)] backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-snow">Derniers vols suivis</h2>
            <p className="text-sm text-snow/60">Synthèse des enregistrements récents</p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/app/my-flights")}
            className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-snow/80 hover:text-snow"
          >
            Voir tout
          </button>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {loading && (
            <div className="col-span-full text-sm text-snow/60">Chargement des favoris...</div>
          )}
          {!loading && lastFavorites.length === 0 && (
            <div className="col-span-full text-sm text-snow/60">
              Ajoutez un vol depuis la carte publique pour le retrouver ici.
            </div>
          )}
          {lastFavorites.map((favorite) => (
            <div
              key={favorite.id}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-snow"
            >
              <p className="text-xs uppercase tracking-[0.35em] text-snow/60">
                {favorite.airline || "Compagnie inconnue"}
              </p>
              <p className="mt-2 text-xl font-semibold text-snow">
                {favorite.flight_number || favorite.flight_id}
              </p>
              <p className="text-sm text-snow/70">{favorite.status || "Terminé"}</p>
              <div className="mt-3 flex items-center justify-between text-xs text-snow/60">
                <span>{formatCoords(favorite.latitude, favorite.longitude)}</span>
                <span>{formatDate(favorite.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
