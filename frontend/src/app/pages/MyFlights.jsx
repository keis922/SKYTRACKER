// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import React, { useMemo, useState, useCallback, useEffect } from "react";
import { useFavorites } from "../../hooks/useFavorites.js";
import { useFlightsStore } from "../../store/useFlightsStore.js";
import Globe from "../../components/Globe.jsx";

function formatDate(value) {
  if (!value) {
    return "Ajout inconnu";
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

function formatCoords(lat, lon) {
  if (lat == null || lon == null) {
    return "Données indisponibles";
  }
  return `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
}

function AddFlightModal({ open, onClose, onAdd, existingFavorites }) {
  const flights = useFlightsStore((state) => state.flights);
  const refreshFlights = useFlightsStore((state) => state.refreshFlights);
  const selectedFlight = useFlightsStore((state) => state.selectedFlight);
  const selectFlight = useFlightsStore((state) => state.selectFlight);
  const clearSelection = useFlightsStore((state) => state.clearSelection);
  const [maxFlights, setMaxFlights] = useState(200);

  useEffect(() => {
    if (open) {
      refreshFlights();
      setMaxFlights(200);
    } else {
      clearSelection();
    }
  }, [open, refreshFlights, clearSelection]);

  const displayFlights = useMemo(() => {
    if (!flights || flights.length === 0) {
      return [];
    }
    return flights.slice(0, Math.min(maxFlights, flights.length));
  }, [flights, maxFlights]);

  const alreadyInFavorites =
    selectedFlight &&
    existingFavorites.some((fav) => fav.flight_id === selectedFlight.id);

  if (!open) {
    return null;
  }

  const sliderMax = Math.min(1000, Math.max(100, flights.length || 300));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur p-4">
      <div className="w-full max-w-6xl rounded-[32px] border border-white/15 bg-[#020817]/95 shadow-[0_30px_120px_rgba(2,6,23,0.8)]">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 text-snow">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-snow/60">Ajouter un vol</p>
            <h2 className="text-xl font-semibold">Sélectionne un appareil à suivre</h2>
          </div>
          <button
            type="button"
            onClick={() => {
              clearSelection();
              onClose();
            }}
            className="rounded-full border border-white/30 bg-white/10 px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-snow hover:bg-white/20"
          >
            Fermer
          </button>
        </div>
        <div className="grid gap-6 p-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="h-[360px] rounded-[28px] border border-white/10 bg-black/60 overflow-hidden">
              <Globe
                className="w-full h-full"
                canvasClassName="w-full h-full"
                cameraPosition={[0, 0, 5.2]}
                fov={36}
                minDistance={2.4}
                maxDistance={7}
                syncBackground={false}
                flightLayerOptions={{ clickable: true, maxItems: maxFlights }}
                showTrack
              />
            </div>
            <div>
              <div className="flex items-center justify-between text-xs text-snow/70">
                <span>Nombre d'avions affichés</span>
                <span>{Math.min(maxFlights, flights.length || 0)}</span>
              </div>
              <input
                type="range"
                min="50"
                max={sliderMax}
                step="50"
                value={Math.min(maxFlights, sliderMax)}
                onChange={(event) => setMaxFlights(Number(event.target.value))}
                className="mt-2 w-full accent-sky"
              />
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-snow/80">
              {selectedFlight ? (
                <>
                  <p className="text-xs uppercase tracking-[0.3em] text-snow/60">
                    Vol sélectionné
                  </p>
                  <p className="text-lg font-semibold text-snow">
                    {selectedFlight.callsign || selectedFlight.icao24 || selectedFlight.id}
                  </p>
                  <p className="text-[11px] text-snow/60">
                    {selectedFlight.airline || selectedFlight.originCountry || "Compagnie inconnue"}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                    <p className="rounded-2xl bg-white/10 px-3 py-2">
                      Altitude:{" "}
                      {selectedFlight.altitudeMeters
                        ? `${Math.round(selectedFlight.altitudeMeters)} m`
                        : "N/A"}
                    </p>
                    <p className="rounded-2xl bg-white/10 px-3 py-2">
                      Vitesse:{" "}
                      {selectedFlight.velocityMs
                        ? `${Math.round(selectedFlight.velocityMs * 3.6)} km/h`
                        : "N/A"}
                    </p>
                  </div>
                </>
              ) : (
                <p>Sélectionne un vol dans la liste ou directement sur la sphère.</p>
              )}
            </div>
          </div>
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between text-snow">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-snow/60">
                  Liste des vols
                </p>
                <p className="text-sm text-snow/80">
                  Clique sur un appareil pour afficher sa position et sa trajectoire.
                </p>
              </div>
            </div>
            <div className="flex-1 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              {displayFlights.length === 0 ? (
                <p className="px-4 py-6 text-sm text-snow/60">
                  Récupération des vols en direct...
                </p>
              ) : (
                <ul className="max-h-[360px] overflow-y-auto divide-y divide-white/10">
                  {displayFlights.map((flight) => (
                    <li
                      key={flight.id}
                      className={`flex items-center justify-between gap-4 px-4 py-3 text-sm ${
                        selectedFlight?.id === flight.id ? "bg-white/10" : ""
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-snow">
                          {flight.callsign || flight.icao24 || flight.id}
                        </p>
                        <p className="text-[11px] text-snow/60">
                          {flight.originCountry || "Pays inconnu"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => selectFlight(flight)}
                        className="rounded-full border border-white/20 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-snow/80 hover:text-snow"
                      >
                        Sélectionner
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              type="button"
              onClick={() => onAdd(selectedFlight)}
              disabled={!selectedFlight || alreadyInFavorites}
              className={`w-full rounded-full px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                selectedFlight && !alreadyInFavorites
                  ? "bg-white text-slate-900"
                  : "bg-white/20 text-white/40 cursor-not-allowed"
              }`}
            >
              {!selectedFlight
                ? "Sélectionne un vol pour l'ajouter"
                : alreadyInFavorites
                ? "Vol déjà présent dans tes favoris"
                : "Ajouter ce vol aux favoris"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MyFlights() {
  const {
    favorites,
    loading,
    updateFavoriteStatus,
    toggleFavorite,
    reload,
    removeFavorite
  } = useFavorites(true);
  const [showModal, setShowModal] = useState(false);

  const handleToggleActive = useCallback(
    (favorite) => {
      updateFavoriteStatus(favorite.id, !favorite.is_active);
    },
    [updateFavoriteStatus]
  );

  function handleOpenMap(code) {
    if (!code) {
      return;
    }
    window.open(`/map?focus=${code}`, "_blank", "noopener,noreferrer");
  }

  const handleAddFromModal = useCallback(
    async (flight) => {
      if (!flight) {
        return;
      }
      await toggleFavorite(flight);
      await reload();
      setShowModal(false);
    },
    [toggleFavorite, reload]
  );

  const handleDeleteFavorite = useCallback(
    async (favoriteId) => {
      if (!favoriteId) {
        return;
      }
      await removeFavorite(favoriteId);
    },
    [removeFavorite]
  );

  const columns = ["Vol", "Compagnie", "Statut", "Coordonnées", "Actions"];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-snow/60">Mes vols suivis</p>
          <h1 className="text-2xl font-semibold text-snow">Gestion centralisée des favoris</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="rounded-full bg-white text-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em]"
          >
            Ajouter un vol
          </button>
          <span className="rounded-full bg-white/10 text-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] border border-white/30">
            {favorites.length} vols
          </span>
        </div>
      </div>
      <div className="rounded-3xl border border-white/10 bg-black/30 shadow-[0_25px_70px_rgba(1,3,11,0.6)] overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 border-b border-white/10 px-6 py-4 text-xs font-semibold uppercase tracking-[0.3em] text-snow/60">
          {columns.map((column) => (
            <span key={column}>{column}</span>
          ))}
        </div>
        {loading ? (
          <div className="px-6 py-6 text-sm text-snow/60">Chargement...</div>
        ) : favorites.length === 0 ? (
          <div className="px-6 py-6 text-sm text-snow/60">
            Ajoutez un vol à partir de la carte publique ou via le bouton ci-dessus pour le suivre ici.
          </div>
        ) : (
          favorites.map((favorite) => {
            const code = favorite.flight_number || favorite.flight_id;
            return (
              <div
                key={favorite.id}
                className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 border-b border-white/5 text-sm items-center text-snow"
              >
                <div>
                  <p className="text-base font-semibold text-snow">{code}</p>
                  <p className="text-[11px] text-snow/60">{formatDate(favorite.created_at)}</p>
                </div>
                <p className="text-snow/70">{favorite.airline || "Compagnie inconnue"}</p>
                <p className="text-snow/70">{favorite.status || "Terminé"}</p>
                <p className="text-snow/70">{formatCoords(favorite.latitude, favorite.longitude)}</p>
                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => handleOpenMap(code)}
                    className="rounded-full border border-white/30 px-3 py-1.5 text-xs font-semibold text-snow/80 hover:text-snow"
                  >
                    Voir sur la carte
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(favorite)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      favorite.is_active
                        ? "bg-emerald-400/20 text-emerald-200"
                        : "bg-white/10 text-snow/60"
                    }`}
                  >
                    {favorite.is_active ? "Actif" : "Inactif"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteFavorite(favorite.id)}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold border border-red-400/50 text-red-200 hover:bg-red-500/10"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
      <AddFlightModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onAdd={handleAddFromModal}
        existingFavorites={favorites}
      />
    </div>
  );
}
