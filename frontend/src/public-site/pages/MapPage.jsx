// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import React, { useEffect, useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Globe from "../../components/Globe.jsx";
import FlightInfoPanel from "../../components/FlightInfoPanel.jsx";
import { useFlightsStore } from "../../store/useFlightsStore.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useFavorites } from "../../hooks/useFavorites.js";
import { AIRPORTS } from "../../data/airports.js";
import api from "../../api/client.js";

const GLOBAL_AIRPORTS_URL = "https://raw.githubusercontent.com/mwgg/Airports/master/airports.json";
const MAX_WORLD_AIRPORTS = Infinity;

const FLIGHT_TYPE_OPTIONS = [
  { value: "all", label: "Tous les vols" },
  { value: "airliner", label: "Compagnies" },
  { value: "jet", label: "Jets" },
  { value: "light", label: "Aviation légère" },
  { value: "heli", label: "Hélicoptères" }
];

const AIRPORT_MODE_OPTIONS = [
  { value: "sites", label: "Sites suivis" },
  { value: "all", label: "Tous" },
  { value: "none", label: "Masquer" }
];

export default function MapPage() {
  const clearSelection = useFlightsStore((state) => state.clearSelection);
  const filters = useFlightsStore((state) => state.filters);
  const filterType = useFlightsStore((state) => state.filters.type);
  const setFilterCount = useFlightsStore((state) => state.setFilterCount);
  const setFilterType = useFlightsStore((state) => state.setFilterType);
  const totalFlights = useFlightsStore((state) => state.flights.length);
  const availableFlights = useFlightsStore((state) => state.availableCount);
  const hasAppliedFilters = useFlightsStore((state) => state.hasAppliedFilters);
  const flights = useFlightsStore((state) => state.flights);
  const selectFlight = useFlightsStore((state) => state.selectFlight);
  const startLiveUpdates = useFlightsStore((state) => state.updateFlightsLoop);
  const stopLiveUpdates = useFlightsStore((state) => state.stopFlightsLoop);
  const { user } = useAuth();
  const favoritesEnabled = Boolean(user);
  const {
    favorites,
    loading: favoritesLoading,
    toggleFavorite,
    reload: reloadFavorites
  } = useFavorites(favoritesEnabled);
  const [airportMode, setAirportMode] = useState("all");
  const [selectedAirport, setSelectedAirport] = useState(null);
  const [airportFlights, setAirportFlights] = useState({
    departures: [],
    arrivals: [],
    loading: false,
    error: null,
    source: "api"
  });
  const [worldAirports, setWorldAirports] = useState([]);
  const [worldAirportsLoading, setWorldAirportsLoading] = useState(false);
  const [worldAirportsError, setWorldAirportsError] = useState(null);

  useEffect(() => {
    startLiveUpdates();
    return () => {
      stopLiveUpdates();
      clearSelection();
    };
  }, [startLiveUpdates, stopLiveUpdates, clearSelection]);

  useEffect(() => {
    if (airportMode !== "all") {
      return;
    }
    if (worldAirports.length > 0 || worldAirportsLoading) {
      return;
    }
    let cancelled = false;
    async function loadWorldAirports() {
      setWorldAirportsLoading(true);
      setWorldAirportsError(null);
      try {
        const response = await fetch(GLOBAL_AIRPORTS_URL);
        if (!response.ok) {
          throw new Error("Impossible de charger la base mondiale des aéroports.");
        }
        const data = await response.json();
        const values = Array.isArray(data)
          ? data
          : Object.values(data || {});
        const normalized = values
          .map((airport) => {
            const latitude = Number(airport.lat ?? airport.latitude ?? airport.Latitude);
            const longitude = Number(airport.lon ?? airport.longitude ?? airport.Longitude);
            return {
              id:
                airport.icao ||
                airport.iata ||
                airport.ident ||
                `${latitude}-${longitude}`,
              iata: airport.iata || airport.IATA || "",
              icao: airport.icao || airport.ICAO || airport.ident || "",
              name: airport.name || airport.Name || airport.city || "Aéroport",
              city: airport.city || airport.City || "",
              country: airport.country || airport.Country || airport.countryName || "",
              latitude,
              longitude,
              isSite: false
            };
          })
          .filter(
            (airport) =>
              airport.id &&
              Number.isFinite(airport.latitude) &&
              Number.isFinite(airport.longitude)
          );
        const limited = normalized.slice(0, MAX_WORLD_AIRPORTS);
        if (!cancelled) {
          setWorldAirports(limited);
          setWorldAirportsLoading(false);
        }
      } catch (error) {
        if (!cancelled) {
          setWorldAirportsLoading(false);
          setWorldAirportsError(error.message || "Impossible de charger les aéroports mondiaux.");
        }
      }
    }
    loadWorldAirports();
    return () => {
      cancelled = true;
    };
  }, [airportMode, worldAirports.length, worldAirportsLoading]);

  const airportsToDisplay = useMemo(() => {
    if (airportMode === "none") {
      return [];
    }
    if (airportMode === "sites") {
      return AIRPORTS.filter((airport) => airport.isSite);
    }
    if (airportMode === "all") {
      return worldAirports.length > 0 ? worldAirports : AIRPORTS;
    }
    return AIRPORTS;
  }, [airportMode, worldAirports]);

  useEffect(() => {
    if (
      airportMode === "none" ||
      (selectedAirport && !airportsToDisplay.some((airport) => airport.id === selectedAirport.id))
    ) {
      setSelectedAirport(null);
    }
  }, [airportMode, airportsToDisplay, selectedAirport]);

  const handleFocusFavorite = useCallback(
    (favorite) => {
      if (!favorite) {
        return;
      }
      const identifiers = [
        favorite.flight_id,
        favorite.flight_number?.trim(),
        favorite.flight_icao?.trim()
      ].filter(Boolean);
      if (identifiers.length === 0) {
        return;
      }
      const match =
        flights.find((flight) => {
          const options = [
            flight.id,
            flight.icao24,
            flight.callsign?.trim(),
            flight.flight_iata?.trim()
          ].filter(Boolean);
          return options.some((value) => identifiers.includes(value));
        }) || null;
      if (match) {
        selectFlight(match);
      }
    },
    [flights, selectFlight]
  );

  const handleAirportSelect = useCallback((airport) => {
    setSelectedAirport((current) => (current && current.id === airport.id ? null : airport));
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadAirportFlights() {
      if (!selectedAirport) {
        setAirportFlights({
          departures: [],
          arrivals: [],
          loading: false,
          error: null,
          source: "api"
        });
        return;
      }
      const airportCode = (selectedAirport.icao || selectedAirport.iata || "").trim();
      if (!airportCode) {
        const fallback = buildAirportSchedulesFromPositions(selectedAirport, flights);
        setAirportFlights({
          departures: fallback.departures,
          arrivals: fallback.arrivals,
          loading: false,
          error: "Aucun code ICAO/ IATA disponible pour cet aéroport.",
          source: "positions"
        });
        return;
      }
      setAirportFlights((prev) => ({
        ...prev,
        loading: true,
        error: null,
        source: "api"
      }));
      try {
        const response = await api.get(`/flights/airport/${encodeURIComponent(airportCode)}`);
        const arrivalsData = Array.isArray(response.data?.arrivals) ? response.data.arrivals : [];
        const departuresData = Array.isArray(response.data?.departures) ? response.data.departures : [];
        if (cancelled) {
          return;
        }
        if (arrivalsData.length > 0 || departuresData.length > 0) {
          setAirportFlights({
            departures: departuresData.slice(0, 6),
            arrivals: arrivalsData.slice(0, 6),
            loading: false,
            error: null,
            source: "api"
          });
          return;
        }
        const fallback = buildAirportSchedulesFromPositions(selectedAirport, flights);
        setAirportFlights({
          departures: fallback.departures,
          arrivals: fallback.arrivals,
          loading: false,
          error: "Aucun vol récent fourni par OpenSky pour cet aéroport.",
          source: "positions"
        });
      } catch (error) {
        if (cancelled) {
          return;
        }
        const fallback = buildAirportSchedulesFromPositions(selectedAirport, flights);
        setAirportFlights({
          departures: fallback.departures,
          arrivals: fallback.arrivals,
          loading: false,
          error: error.message || "Impossible de récupérer les vols OpenSky pour cet aéroport.",
          source: "positions"
        });
      }
    }
    loadAirportFlights();
    return () => {
      cancelled = true;
    };
  }, [selectedAirport, flights]);

  const sliderMax = Math.max(
    hasAppliedFilters ? availableFlights : totalFlights,
    0
  );
  const sliderValue = Math.min(filters.count, sliderMax);

  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-4rem)] text-snow overflow-hidden">
        <div className="absolute inset-0">
          <Globe
            className="w-full h-full"
            canvasClassName="w-full h-full"
            cameraPosition={[0, 0, 5.2]}
            fov={34}
            minDistance={2.4}
            maxDistance={7}
            syncBackground
            introAnimation
            introKey="map-globe"
            flightLayerOptions={{ clickable: true, maxItems: null }}
            showTrack
            airportLayerOptions={{
              airports: airportsToDisplay,
              onSelect: handleAirportSelect,
              activeAirportId: selectedAirport?.id || null
            }}
          />
        </div>
        <div className="relative z-10 pointer-events-none h-full">
  
        
        <div className="absolute top-8 right-8 w-full max-w-[360px] pointer-events-auto">
          
          <div className="max-h-[calc(100vh-10rem)] overflow-y-auto pr-2 space-y-4">
          <div className="rounded-3xl bg-black/60 border border-white/10 px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-snow/70">
                Nombre de vols
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] hover:bg-white/20 transition"
              >
                Accueil
              </Link>
            </div>
            <input
              type="range"
              min="0"
              max={sliderMax}
              step="10"
              value={sliderValue}
              onChange={(event) => setFilterCount(Number(event.target.value))}
              className="w-full mt-1 accent-sky"
            />
            <div className="flex items-center justify-between text-[11px] text-snow/60 mt-2">
              <span>0</span>
              <span>
                {sliderValue} / {sliderMax} vols
              </span>
              <span>{sliderMax}</span>
            </div>
            <div className="mt-4 space-y-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-snow/60">
                Type d&apos;appareil
              </p>
              <div className="grid grid-cols-2 gap-2">
                {FLIGHT_TYPE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFilterType(option.value)}
                    className={`rounded-2xl px-3 py-2 text-[11px] font-semibold border ${
                      filterType === option.value
                        ? "bg-sky/20 border-sky text-sky"
                        : "bg-white/5 border-white/15 text-snow/80 hover:bg-white/10"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="drop-shadow-2xl">
            <FlightInfoPanel
              favorites={favorites}
              favoritesLoading={favoritesLoading}
              toggleFavorite={toggleFavorite}
              canFavorite={favoritesEnabled}
            />
          </div>
          {favoritesEnabled && (
            <div className="rounded-3xl bg-black/55 border border-white/10 px-4 py-4 space-y-3">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-snow/70">
                <span>Mes favoris</span>
                <button
                  type="button"
                  onClick={reloadFavorites}
                  className="px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-[10px] hover:bg-white/20"
                >
                  Rafraîchir
                </button>
              </div>
              {favoritesLoading ? (
                <p className="text-[11px] text-snow/60">Chargement de vos vols...</p>
              ) : favorites.length === 0 ? (
                <p className="text-[11px] text-snow/60">
                  Cliquez sur un avion puis « Ajouter aux favoris » pour l&apos;enregistrer ici.
                </p>
              ) : (
                <ul className="space-y-2">
                  {favorites.slice(0, 5).map((favorite) => (
                    <li
                      key={favorite.id}
                      className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-snow/80 flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-snow">
                          {favorite.flight_number || favorite.flight_id}
                        </p>
                        <p className="text-[10px] text-snow/60">
                          {favorite.airline || favorite.status || "Terminé"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFocusFavorite(favorite)}
                        className="text-[10px] px-2 py-1 rounded-full bg-sky/10 text-sky hover:bg-sky/20"
                      >
                        Afficher
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <div className="rounded-3xl bg-black/60 border border-white/10 px-4 py-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-snow/70">
                Aéroports visibles
              </p>
              <span className="text-[10px] text-snow/50">
                {airportsToDisplay.length} points
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {AIRPORT_MODE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setAirportMode(option.value)}
                  className={`rounded-2xl px-2 py-2 text-[10px] font-semibold border ${
                    airportMode === option.value
                      ? "bg-amber-500/20 border-amber-400 text-amber-200"
                      : "bg-white/5 border-white/15 text-snow/70 hover:bg-white/10"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-snow/60 mt-2">
              Cliquez sur un aéroport pour voir ses départs et arrivées prévus.
            </p>
            {airportMode === "all" && worldAirportsLoading && (
              <p className="text-[10px] text-sky mt-2">
                Chargement des aéroports mondiaux...
              </p>
            )}
            {airportMode === "all" && worldAirportsError && (
              <p className="text-[10px] text-red-300 mt-2">{worldAirportsError}</p>
            )}
            {airportsToDisplay.length === 0 ? (
              <p className="text-[11px] text-snow/60 mt-4">Aucun aéroport n&apos;est visible.</p>
            ) : (
              <ul className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-1">
                {airportsToDisplay.map((airport) => (
                  <li key={airport.id}>
                    <button
                      type="button"
                      onClick={() => handleAirportSelect(airport)}
                      className={`w-full rounded-2xl border px-3 py-2 text-left text-[11px] ${
                        selectedAirport?.id === airport.id
                          ? "bg-amber-400/10 border-amber-300 text-amber-100"
                          : "bg-white/5 border-white/15 text-snow/80 hover:bg-white/10"
                      }`}
                    >
                      <p className="text-sm font-semibold text-snow">{airport.name}</p>
                      <p className="text-[10px] text-snow/60">
                        {airport.city} • {airport.country}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          </div>
        </div>
        {selectedAirport && (
          <div className="absolute top-[210px] left-8 max-w-md pointer-events-auto">
            <div className="rounded-3xl bg-black/70 border border-white/15 px-4 py-4 space-y-3 relative">
              <button
                type="button"
                onClick={() => setSelectedAirport(null)}
                className="absolute top-3 right-3 px-2 py-1 rounded-full bg-white/10 text-[10px] text-snow/70 border border-white/20 hover:bg-white/20"
              >
                Fermer
              </button>
              <div className="flex items-start justify-between gap-3 pr-8">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-sky">Aéroport</p>
                  <p className="text-lg font-semibold text-snow">{selectedAirport.name}</p>
                  <p className="text-[11px] text-snow/60">
                    {selectedAirport.city || "Ville inconnue"}, {selectedAirport.country || "Pays inconnu"} •{" "}
                    {selectedAirport.iata || selectedAirport.icao || "—"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div className="rounded-2xl bg-white/5 border border-white/10 px-3 py-2 space-y-1">
                  <p className="uppercase tracking-[0.2em] text-[10px] text-snow/60">Départs</p>
                  {airportFlights.loading ? (
                    <p className="text-snow/60">Chargement...</p>
                  ) : airportFlights.departures.length === 0 ? (
                    <p className="text-snow/60">Aucun départ en cours.</p>
                  ) : (
                    <ul className="space-y-2">
                      {airportFlights.departures.map((flight) => (
                        <li key={flight.id || flight.icao24}>
                          <p className="text-snow font-semibold">
                            {flight.callsign || flight.flightNumber || flight.icao24 || "Vol"}
                          </p>
                          <p className="text-snow/60 text-[10px]">
                            Vers {flight.arrivalAirport || "destination inconnue"}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="rounded-2xl bg-white/5 border border-white/10 px-3 py-2 space-y-1">
                  <p className="uppercase tracking-[0.2em] text-[10px] text-snow/60">Arrivées</p>
                  {airportFlights.loading ? (
                    <p className="text-snow/60">Chargement...</p>
                  ) : airportFlights.arrivals.length === 0 ? (
                    <p className="text-snow/60">Aucune arrivée en cours.</p>
                  ) : (
                    <ul className="space-y-2">
                      {airportFlights.arrivals.map((flight) => (
                        <li key={flight.id || `${flight.icao24}-arr`}>
                          <p className="text-snow font-semibold">
                            {flight.callsign || flight.flightNumber || flight.icao24 || "Vol"}
                          </p>
                          <p className="text-snow/60 text-[10px]">
                            Depuis {flight.departureAirport || "origine inconnue"}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <p className={`text-[10px] ${airportFlights.error ? "text-red-300" : "text-snow/60"}`}>
                {airportFlights.error
                  ? airportFlights.error
                  : airportFlights.source === "api"
                    ? "Données collectées via le flux temps réel."
                    : airportFlights.source === "fallback"
                      ? "Aucun vol correspondant via l'API, estimation basée sur les appareils suivis."
                      : "Données estimées depuis les vols suivis sur le globe."}
              </p>
            </div>
          </div>
        )}
      </div>
      <div
  className="absolute inset-x-0 z-50 px-4 sm:px-0 pointer-events-auto"
  style={{ bottom: "300px" }}
>
        <div className="mx-auto max-w-xl rounded-[15px] border border-white/10 bg-black/70 px-6 py-4 text-center backdrop-blur">
          <div className="text-[10px] uppercase tracking-[0.25em] text-white/70 mb-1">
            Altitude
          </div>
          <div className="h-2 rounded-full bg-gradient-to-r from-[#fb923c] via-[#fb7185] to-[#ec4899]" />
          <div className="flex justify-between text-[10px] text-white/60 mt-1">
            <span>0 m</span>
            <span>+12 000 m</span>
          </div>
        </div>
      </div> 
    </div>
  );
}

function normalizeAirportToken(value) {
  return (value || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
}

function buildAirportMatcher(airport) {
  if (!airport) {
    return () => false;
  }
  const codeTokens = [airport.iata, airport.icao]
    .map((code) => (code || "").trim().toUpperCase())
    .filter(Boolean);
  const normalizedCodeTokens = codeTokens.map((code) => normalizeAirportToken(code));
  const nameTokens = [airport.name, airport.city, airport.country]
    .map(normalizeAirportToken)
    .filter(Boolean);
  return (value) => {
    if (!value) {
      return false;
    }
    const stringValue = value.toString().trim();
    if (!stringValue) {
      return false;
    }
    const upperValue = stringValue.toUpperCase();
    if (codeTokens.some((code) => code === upperValue)) {
      return true;
    }
    const normalized = normalizeAirportToken(stringValue);
    if (!normalized) {
      return false;
    }
    if (normalizedCodeTokens.some((code) => code && code === normalized)) {
      return true;
    }
    return [...nameTokens, ...normalizedCodeTokens].some(
      (token) => token && (normalized.includes(token) || token.includes(normalized))
    );
  };
}

function matchesAnyField(matcher, fields) {
  return fields.some((value) => matcher(value));
}

function buildAirportSchedulesFromFlights(airport, flights, limit = 6) {
  const matchesAirport = buildAirportMatcher(airport);
  const departures = flights
    .filter((flight) =>
      matchesAnyField(matchesAirport, [
        flight.departureAirport,
        flight.departureIata,
        flight.departureIcao
      ])
    )
    .slice(0, limit);
  const arrivals = flights
    .filter((flight) =>
      matchesAnyField(matchesAirport, [
        flight.arrivalAirport,
        flight.arrivalIata,
        flight.arrivalIcao
      ])
    )
    .slice(0, limit);
  return {
    departures,
    arrivals,
    hasMatches: departures.length > 0 || arrivals.length > 0
  };
}

function buildAirportSchedulesFromPositions(airport, flights, limit = 6) {
  if (!airport) {
    return { departures: [], arrivals: [], hasMatches: false };
  }
  const matchesAirport = buildAirportMatcher(airport);
  const departures = flights
    .filter((flight) =>
      matchesAnyField(matchesAirport, [
        flight.departureAirport,
        flight.departureIata,
        flight.departureIcao
      ])
    )
    .slice(0, limit);
  const arrivals = flights
    .filter((flight) =>
      matchesAnyField(matchesAirport, [
        flight.arrivalAirport,
        flight.arrivalIata,
        flight.arrivalIcao
      ])
    )
    .slice(0, limit);
  return {
    departures,
    arrivals,
    hasMatches: departures.length > 0 || arrivals.length > 0
  };
}
