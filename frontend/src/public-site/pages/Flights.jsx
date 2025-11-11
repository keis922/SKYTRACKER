// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/client.js";
import Loader from "../../components/Loader.jsx";
import FlightCard from "../../components/FlightCard.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useFavorites } from "../../hooks/useFavorites.js";

function fallbackFlightsFromPositions(positions = []) {
  return positions
    .filter((item) => item && (item.callsign || item.icao24))
    .map((item, index) => {
      const id = `${item.icao24 || item.id || index}-fallback`;
      const speedKmh =
        typeof item.speedKmh === "number"
          ? item.speedKmh
          : typeof item.velocity === "number"
          ? Math.round(item.velocity * 3.6)
          : null;
      const callsignKey = (item.callsign || item.icao24 || "")
        .toString()
        .replace(/\s+/g, "")
        .toUpperCase();
      return {
        id,
        flightNumber: item.callsign || item.icao24 || "N/A",
        flightKey: callsignKey,
        icao24: item.icao24 || null,
        airline: item.airline || item.originCountry || "OpenSky",
        status: item.onGround ? "Au sol" : "En vol",
        departureAirport: item.departureAirport || "—",
        departureCountry: item.departureCountry || item.originCountry || "",
        arrivalAirport: item.arrivalAirport || "—",
        arrivalCountry: item.arrivalCountry || "",
        altitude: item.altitude || item.altitudeMeters || null,
        speed: speedKmh,
        departureTime: null,
        arrivalTime: null,
        imageUrl: null
      };
    });
}

export default function Flights() {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useAuth();
  const { favorites, toggleFavorite } = useFavorites(Boolean(user));

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const response = await api.get("/flights");
        if (cancelled) {
          return;
        }
        let list = response.data.flights || [];
        if (!list.length) {
          const positionsResponse = await api.get("/positions");
          if (!cancelled) {
            list = fallbackFlightsFromPositions(positionsResponse.data.positions || []);
          }
        }
        if (!cancelled) {
          setFlights(list);
        }
      } catch {
        if (!cancelled) {
          setFlights([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    const interval = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, countryFilter, flights]);

  const countries = useMemo(() => {
    const list = new Set();
    flights.forEach((flight) => {
      if (flight.departureCountry) {
        list.add(flight.departureCountry);
      }
      if (flight.arrivalCountry) {
        list.add(flight.arrivalCountry);
      }
    });
    return Array.from(list).sort();
  }, [flights]);

  const statuses = useMemo(() => {
    const list = new Set();
    flights.forEach((flight) => {
      if (flight.status) {
        list.add(flight.status);
      }
    });
    return Array.from(list).sort();
  }, [flights]);

  const filteredFlights = useMemo(
    () =>
      flights.filter((flight) => {
        const text = `${flight.flightNumber || ""} ${flight.airline || ""} ${
          flight.departureAirport || ""
        } ${flight.arrivalAirport || ""}`.toLowerCase();
        const term = search.toLowerCase();
        if (term && !text.includes(term)) {
          return false;
        }
        if (statusFilter && flight.status !== statusFilter) {
          return false;
        }
        if (
          countryFilter &&
          flight.departureCountry !== countryFilter &&
          flight.arrivalCountry !== countryFilter
        ) {
          return false;
        }
        return true;
      }),
    [flights, search, statusFilter, countryFilter]
  );

  const perPage = 200;
  const pageCount = Math.max(1, Math.ceil(filteredFlights.length / perPage));
  const safePage = Math.min(currentPage, pageCount);
  const startIndex = (safePage - 1) * perPage;
  const paginatedFlights = filteredFlights.slice(startIndex, startIndex + perPage);

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-snow/60">
            Vols commerciaux
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-snow">
            Filtrez et explorez les vols en cours.
          </h1>
          <p className="text-xs sm:text-sm text-snow/70 mt-1">
            Affinez la liste par compagnie, pays ou statut pour trouver rapidement un vol.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-snow/60">
          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
            {flights.length} vols actifs
          </span>
          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
            Mise à jour toutes les 30 s
          </span>
        </div>
      </div>
      <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-4 sm:px-6 sm:py-5 shadow-[0_25px_70px_rgba(15,23,42,0.9)] space-y-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-snow/70">
              Compagnie, aéroport ou numéro de vol
            </label>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-night/60 px-3 py-2 text-xs sm:text-sm text-snow placeholder:text-snow/40 focus:outline-none focus:ring-2 focus:ring-sky focus:border-sky/50"
              placeholder="Rechercher une compagnie ou un aéroport"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-snow/70">
              Pays de départ ou d&apos;arrivée
            </label>
            <select
              value={countryFilter}
              onChange={(event) => setCountryFilter(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-night/60 px-3 py-2 text-xs sm:text-sm text-snow focus:outline-none focus:ring-2 focus:ring-sky focus:border-sky/50"
            >
              <option value="">Tous les pays</option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-snow/70">
              Statut du vol
            </label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-night/60 px-3 py-2 text-xs sm:text-sm text-snow focus:outline-none focus:ring-2 focus:ring-sky focus:border-sky/50"
            >
              <option value="">Tous les statuts</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      {loading ? (
        <Loader />
      ) : (
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
          {paginatedFlights.map((flight) => {
            const isFavorite = favorites?.some((fav) => fav.flight_id === flight.id) || false;
            return (
              <FlightCard
                key={flight.id}
                flight={flight}
                isFavorite={isFavorite}
                onToggleFavorite={toggleFavorite}
              />
            );
          })}
          {filteredFlights.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-8 text-sm text-snow/70 text-center">
              Aucun vol ne correspond aux critères actuels.
            </div>
          )}
        </div>
      )}
      {filteredFlights.length > perPage && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 text-xs text-snow/70">
          <p>
            Affichage {startIndex + 1} – {Math.min(filteredFlights.length, startIndex + perPage)} sur {filteredFlights.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={safePage === 1}
              className="rounded-full border border-white/20 px-3 py-1 text-[11px] uppercase tracking-[0.3em] disabled:opacity-40"
            >
              Précédent
            </button>
            <span className="text-[11px]">
              Page {safePage} / {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
              disabled={safePage === pageCount}
              className="rounded-full border border-white/20 px-3 py-1 text-[11px] uppercase tracking-[0.3em] disabled:opacity-40"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
