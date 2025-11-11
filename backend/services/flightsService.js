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
let lastFlightsUpdate = 0;
let lastPositionsUpdate = 0;
let openSkyToken = null;
let openSkyTokenExpiresAt = 0;
const updateIntervalMs = 5000;
const openSkyStatesUrl = process.env.OPENSKY_URL || "https://opensky-network.org/api/states/all";
const openSkyTokenUrl =
  "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token";
const openSkyTracksUrl = "https://opensky-network.org/api/tracks/all";

function normalizeFlights(raw) {
  if (!raw || !Array.isArray(raw.data)) return [];
  return raw.data
    .map((item, index) => {
      const flightNumber = item.flight?.iata || item.flight?.icao || "";
      const latitude = item.live?.latitude ?? null;
      const longitude = item.live?.longitude ?? null;
      if (latitude == null || longitude == null) return null;
      return {
        id: `${flightNumber || "flight"}-${index}`,
        flightNumber,
        flightKey: flightNumber.toString().replace(/\s+/g, "").toUpperCase(),
        departureAirport: item.departure?.airport || "",
        arrivalAirport: item.arrival?.airport || "",
        latitude,
        longitude,
        altitude: item.live?.altitude ?? null,
        speed: item.live?.speed_horizontal ?? null,
        imageUrl: null
      };
    })
    .filter(Boolean);
}

function normalizePositions(raw) {
  if (!raw || !Array.isArray(raw.states)) return [];
  return raw.states
    .map((state) => {
      const [icao24, callsign, originCountry, , , longitude, latitude, baroAltitude, onGround, velocity, heading] = state;
      if (latitude == null || longitude == null) return null;
      return {
        id: icao24,
        icao24,
        callsign: (callsign || "").trim(),
        callsignKey: (callsign || "").replace(/\s+/g, "").toUpperCase(),
        originCountry,
        latitude,
        longitude,
        altitude: baroAltitude,
        onGround,
        velocity,
        heading,
        timePosition: state[3] || state[4] || null
      };
    })
    .filter(Boolean);
}

async function getOpenSkyAccessToken() {
  const clientId = process.env.OPENSKY_CLIENT_ID;
  const clientSecret = process.env.OPENSKY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  if (openSkyToken && Date.now() < openSkyTokenExpiresAt - 60000) return openSkyToken;
  const body = new URLSearchParams();
  body.append("grant_type", "client_credentials");
  body.append("client_id", clientId);
  body.append("client_secret", clientSecret);
  try {
    const response = await axios.post(openSkyTokenUrl, body.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 10000
    });
    const token = response.data && response.data.access_token;
    if (!token) return null;
    const expiresIn = response.data.expires_in || 1800;
    openSkyToken = token;
    openSkyTokenExpiresAt = Date.now() + expiresIn * 1000;
    return token;
  } catch {
    return null;
  }
}

async function fetchFlightsFromAviationStack() {
  const key = process.env.AVIATIONSTACK_KEY;
  if (!key) return [];
  try {
    const response = await axios.get("http://api.aviationstack.com/v1/flights", {
      params: { access_key: key, limit: 100, flight_status: "active" },
      timeout: 10000
    });
    return normalizeFlights(response.data);
  } catch {
    return [];
  }
}

async function fetchPositionsFromOpenSky() {
  try {
    const headers = {};
    const token = await getOpenSkyAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await axios.get(openSkyStatesUrl, { timeout: 10000, headers });
    return normalizePositions(response.data);
  } catch (error) {
    return positionsCache;
  }
}

async function fetchTrackFromOpenSky(icao24, timeSeconds = Math.floor(Date.now() / 1000)) {
  if (!icao24) return [];
  try {
    const headers = {};
    const token = await getOpenSkyAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await axios.get(openSkyTracksUrl, {
      timeout: 10000,
      headers,
      params: { icao24, time: timeSeconds }
    });
    const path = Array.isArray(response.data.path) ? response.data.path : [];
    return path
      .filter((segment) => Array.isArray(segment) && segment.length >= 3)
      .map((segment) => ({ latitude: segment[1], longitude: segment[2], altitudeMeters: segment[3] ?? 0 }));
  } catch {
    return [];
  }
}

async function refreshFlights() {
  const flights = await fetchFlightsFromAviationStack();
  if (flights.length > 0) {
    flightsCache = flights;
    lastFlightsUpdate = Date.now();
  }
}

async function refreshPositions() {
  const positions = await fetchPositionsFromOpenSky();
  if (positions.length > 0) {
    positionsCache = positions;
    lastPositionsUpdate = Date.now();
  }
}

export async function getFlights() {
  if (Date.now() - lastFlightsUpdate > updateIntervalMs) {
    await refreshFlights();
  }
  return flightsCache;
}

export async function getPositions() {
  if (positionsCache.length === 0) {
    await refreshPositions();
    return positionsCache;
  }
  if (Date.now() - lastPositionsUpdate > updateIntervalMs) {
    refreshPositions();
  }
  return positionsCache;
}

export async function getFlightsForAirport() {
  return { arrivals: [], departures: [] };
}

export async function getTrackForAircraft(icao24, timeSeconds) {
  return fetchTrackFromOpenSky(icao24, timeSeconds);
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
