// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import axios from "axios";

let flightsCache = [];
let positionsCache = [];
const updateIntervalMs = 10000;
const openSkyStatesUrl = "https://opensky-network.org/api/states/all";

function normalizeFlights(raw) {
  if (!raw || !Array.isArray(raw.data)) return [];
  return raw.data
    .map((item, index) => {
      const callsign = (item.flight?.iata || item.flight?.icao || "").trim();
      const latitude = item.live?.latitude ?? null;
      const longitude = item.live?.longitude ?? null;
      if (latitude == null || longitude == null) return null;
      return {
        id: `${callsign || "flight"}-${index}`,
        flightNumber: callsign,
        departureAirport: item.departure?.airport || "",
        arrivalAirport: item.arrival?.airport || "",
        latitude,
        longitude,
        altitude: item.live?.altitude ?? null,
        speed: item.live?.speed_horizontal ?? null
      };
    })
    .filter(Boolean);
}

function normalizePositions(raw) {
  if (!raw || !Array.isArray(raw.states)) return [];
  return raw.states
    .map((state) => {
      const [icao24, callsign, originCountry, , , longitude, latitude, altitude, onGround, velocity, heading] = state;
      if (latitude == null || longitude == null) return null;
      return {
        id: icao24,
        icao24,
        callsign: (callsign || "").trim(),
        originCountry,
        latitude,
        longitude,
        altitude,
        onGround,
        velocity,
        heading,
        timePosition: state[3] || state[4] || null
      };
    })
    .filter(Boolean);
}

async function refreshFlights() {
  const key = process.env.AVIATIONSTACK_KEY;
  if (!key) return;
  try {
    const response = await axios.get("http://api.aviationstack.com/v1/flights", {
      params: { access_key: key, limit: 100, flight_status: "active" },
      timeout: 10000
    });
    flightsCache = normalizeFlights(response.data);
  } catch {}
}

async function refreshPositions() {
  try {
    const response = await axios.get(openSkyStatesUrl, { timeout: 10000 });
    positionsCache = normalizePositions(response.data);
  } catch {}
}

export async function getFlights() {
  if (!flightsCache.length) await refreshFlights();
  return flightsCache;
}

export async function getPositions() {
  if (!positionsCache.length) await refreshPositions();
  return positionsCache;
}

export async function getFlightsForAirport(airportCode) {
  return { arrivals: [], departures: [] };
}

export async function getTrackForAircraft() {
  return [];
}

export async function getAircraftPhoto() {
  return null;
}

export function initFlightUpdates() {
  refreshFlights();
  setInterval(refreshFlights, updateIntervalMs);
}

export function initPositionUpdates() {
  refreshPositions();
  setInterval(refreshPositions, updateIntervalMs);
}
