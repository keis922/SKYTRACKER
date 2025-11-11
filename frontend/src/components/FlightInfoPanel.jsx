// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import React from "react";
import { useFlightsStore } from "../store/useFlightsStore.js";

function formatNumber(value) {
  if (!value && value !== 0) {
    return "";
  }
  return value.toLocaleString("fr-FR");
}

export default function FlightInfoPanel({
  favorites = [],
  favoritesLoading = false,
  toggleFavorite,
  canFavorite = false
}) {
  const selectedFlight = useFlightsStore((state) => state.selectedFlight);
  const loadingTrack = useFlightsStore((state) => state.loadingTrack);
  const error = useFlightsStore((state) => state.error);
  const aircraftPhoto = useFlightsStore((state) => state.aircraftPhoto);
  const trackPoints = useFlightsStore((state) => state.trackPoints);
  const clearSelection = useFlightsStore((state) => state.clearSelection);

  if (!selectedFlight) {
    return (
      <div className="rounded-3xl bg-black/60 border border-white/10 px-4 py-4 sm:px-5 sm:py-5 space-y-3 text-sm text-snow/70">
        <div>
          {error ? (
            <p className="text-[11px] text-red-300">
              Flux OpenSky temporairement indisponible. Réessaie dans quelques minutes.
            </p>
          ) : (
            <p className="text-[11px] text-snow/60">
              Aucun avion sélectionné. Clique sur un point lumineux pour afficher le trajet.
            </p>
          )}
        </div>
      </div>
    );
  }

  const altitudeFeet = selectedFlight.altitudeMeters || 0;
  const altitudeMeters = altitudeFeet;
  const speedMs = selectedFlight.velocityMs || 0;
  const speedKmh = speedMs * 3.6;
  const flightIdentifier = selectedFlight.id || selectedFlight.icao24 || selectedFlight.callsign;
  const isFavorite =
    canFavorite &&
    favorites.some((favorite) => favorite.flight_id === flightIdentifier);

  function handleToggleFavorite() {
    if (!canFavorite || !toggleFavorite || !flightIdentifier) {
      return;
    }
    toggleFavorite({
      id: flightIdentifier,
      flightNumber: selectedFlight.callsign || selectedFlight.flightNumber || selectedFlight.icao24 || "",
      airline: selectedFlight.airline || "",
      status: selectedFlight.status || "",
      departureAirport: selectedFlight.departureAirport || "",
      arrivalAirport: selectedFlight.arrivalAirport || "",
      latitude: selectedFlight.latitude,
      longitude: selectedFlight.longitude
    });
  }

  function handleExportTrack() {
    if (!trackPoints || trackPoints.length === 0) {
      return;
    }
    const header = "latitude,longitude,altitude_m\n";
    const lines = trackPoints
      .map((point) => {
        const lat = point.latitude ?? "";
        const lon = point.longitude ?? "";
        const alt = point.altitudeMeters ?? "";
        return `${lat},${lon},${alt}`;
      })
      .join("\n");
    const blob = new Blob([header + lines], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const label = selectedFlight.callsign || selectedFlight.icao24 || "vol";
    link.download = `${label}-trajet.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="rounded-3xl bg-black/70 border border-white/10 px-4 py-4 sm:px-5 sm:py-5 space-y-4 text-sm text-snow/80 relative">
      <button
        type="button"
        onClick={clearSelection}
        className="absolute top-3 right-3 text-[10px] px-2 py-1 rounded-full bg-white/10 border border-white/20 text-snow/70 hover:bg-white/20"
      >
        Fermer
      </button>
      {aircraftPhoto && (
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <img
            src={aircraftPhoto}
            alt={`Photo de l'avion ${selectedFlight.callsign || selectedFlight.icao24}`}
            className="w-full h-48 object-cover"
            loading="lazy"
          />
        </div>
      )}
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.25em] uppercase text-sky">
            Vol sélectionné
          </p>
          <p className="text-xl font-semibold text-snow">
            {selectedFlight.callsign || selectedFlight.icao24 || "Vol en direct"}
          </p>
          <p className="text-[11px] text-snow/60 mt-1">
            {selectedFlight.originCountry || "Pays d&apos;origine inconnu"}
          </p>
        </div>
        <div className="px-3 py-1.5 rounded-full bg-sky/10 border border-sky/40 text-[11px] text-sky">
          Données OpenSky
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-[11px]">
        <div className="rounded-2xl bg-white/5 border border-white/10 px-3 py-2">
          <p className="uppercase tracking-[0.2em] text-[10px] text-snow/60">
            Altitude
          </p>
          <p className="mt-1 text-sm font-semibold text-snow">
            {formatNumber(Math.round(altitudeMeters))} m
          </p>
        </div>
        <div className="rounded-2xl bg-white/5 border border-white/10 px-3 py-2">
          <p className="uppercase tracking-[0.2em] text-[10px] text-snow/60">
            Vitesse
          </p>
          <p className="mt-1 text-sm font-semibold text-snow">
            {formatNumber(Math.round(speedKmh))} km/h
          </p>
        </div>
        <div className="rounded-2xl bg-white/5 border border-white/10 px-3 py-2">
          <p className="uppercase tracking-[0.2em] text-[10px] text-snow/60">
            Direction
          </p>
          <p className="mt-1 text-sm font-semibold text-snow">
            {Math.round(selectedFlight.heading || 0)}°
          </p>
        </div>
        <div className="rounded-2xl bg-white/5 border border-white/10 px-3 py-2">
          <p className="uppercase tracking-[0.2em] text-[10px] text-snow/60">
            Identifiant
          </p>
          <p className="mt-1 text-xs font-semibold text-snow">
            {selectedFlight.icao24}
          </p>
        </div>
      </div>
      <div className="text-[11px] text-snow/60">
        {loadingTrack
          ? "Calcul de la trajectoire complète en cours..."
          : "La trajectoire complète est affichée sur le globe."}
      </div>
      <div className="space-y-2">
        {canFavorite ? (
          <>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleToggleFavorite}
                className={`flex-1 min-w-[140px] text-[11px] px-3 py-2 rounded-2xl border ${
                  isFavorite
                    ? "bg-sky/20 border-sky text-sky"
                    : "bg-white/5 border-white/20 text-snow hover:bg-white/10"
                }`}
                disabled={favoritesLoading}
              >
                {isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
              </button>
              <button
                type="button"
                onClick={handleExportTrack}
                disabled={!trackPoints || trackPoints.length === 0}
                className="flex-1 min-w-[140px] text-[11px] px-3 py-2 rounded-2xl border border-white/20 bg-white/5 text-snow hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Exporter la trajectoire
              </button>
            </div>
            {favoritesLoading && (
              <p className="text-[10px] text-snow/60">Mise à jour de vos favoris...</p>
            )}
          </>
        ) : (
          <p className="text-[11px] text-snow/60">
            Connecte-toi pour ajouter ce vol à tes favoris et exporter sa trajectoire.
          </p>
        )}
      </div>
    </div>
  );
}
