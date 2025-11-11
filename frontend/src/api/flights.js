// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import axios from "axios";

const API_URL = "https://api.aviationstack.com/v1/flights";
const ACCESS_KEY = "fbdd13357da88b65ddca0e9a7d8fc02c";

async function fetchOpenSkyFallback() {
  const response = await axios.get("https://opensky-network.org/api/states/all", {
    timeout: 12000
  });
  const raw = response.data && Array.isArray(response.data.states) ? response.data.states : [];
  const withCoords = raw.filter((state) => state[5] != null && state[6] != null);
  const pool = withCoords.slice();
  const selected = [];
  while (selected.length < 20 && pool.length > 0) {
    const index = Math.floor(Math.random() * pool.length);
    selected.push(pool.splice(index, 1)[0]);
  }
  return selected.map((state, index) => {
    const callsign = (state[1] || "").trim();
    const longitude = state[5];
    const latitude = state[6];
    const altitudeMeters = state[7] || 0;
    const altitudeFeet = altitudeMeters * 3.28084;
    const direction = state[10] || 0;
    return {
      id: callsign || state[0] || `os-flight-${index}`,
      callsign,
      from: "",
      to: "",
      latitude,
      longitude,
      altitude: altitudeFeet,
      direction
    };
  });
}

export async function fetchLiveFlights() {
  try {
    const response = await axios.get(API_URL, {
      params: {
        access_key: ACCESS_KEY,
        limit: 100,
        flight_status: "active"
      },
      timeout: 12000
    });
    if (!response.data || response.data.error) {
      return fetchOpenSkyFallback();
    }
    const data = Array.isArray(response.data.data) ? response.data.data : [];
    const withCoords = data.filter((item) => {
      const live = item.live || {};
      return (
        live &&
        live.latitude != null &&
        live.longitude != null &&
        typeof live.latitude === "number" &&
        typeof live.longitude === "number"
      );
    });
    const pool = withCoords.slice();
    const selected = [];
    while (selected.length < 20 && pool.length > 0) {
      const index = Math.floor(Math.random() * pool.length);
      selected.push(pool.splice(index, 1)[0]);
    }
    if (selected.length === 0) {
      return fetchOpenSkyFallback();
    }
    return selected.map((flight, index) => {
      const live = flight.live || {};
      const callsign =
        (flight.flight && (flight.flight.iata || flight.flight.icao)) ||
        flight.callsign ||
        "";
      return {
        id:
          callsign ||
          flight.aircraft?.registration ||
          flight.airline?.iata ||
          `flight-${index}`,
        callsign,
        from: flight.departure?.airport || "",
        to: flight.arrival?.airport || "",
        latitude: live.latitude,
        longitude: live.longitude,
        altitude: live.altitude || 0,
        direction: live.direction || 0
      };
    });
  } catch {
    return fetchOpenSkyFallback();
  }
}
