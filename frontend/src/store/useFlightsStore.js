// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import { create } from "zustand";

const BACKEND_POSITIONS_URL = "/api/positions";
const BACKEND_TRACK_URL = "/api/tracks";

const AIRLINE_CALLSIGN_PREFIXES = [
  "AFR",
  "AF",
  "AAL",
  "DAL",
  "UAL",
  "BAW",
  "EZY",
  "RYR",
  "UAE",
  "QTR",
  "ETD",
  "DLH",
  "TAP",
  "THY",
  "SAS",
  "KLM",
  "IBE",
  "VLG",
  "LOT",
  "SWA",
  "ANA",
  "JAL",
  "CPA",
  "ANZ",
  "QFA",
  "VOZ",
  "ACA",
  "ASA",
  "JBU",
  "TUI",
  "TOM",
  "VIR",
  "EVA",
  "CPC",
  "AMX",
  "LAN",
  "TAM"
];

const HELI_CALLSIGN_PREFIXES = [
  "HEL",
  "HLI",
  "HLE",
  "HEC",
  "HKS",
  "HU",
  "HNS",
  "HBZ",
  "FHE",
  "OHH",
  "OOH",
  "PHH",
  "GHH"
];

const HELI_REGISTRATION_PATTERNS = [
  /^HBZ/,
  /^F-H/,
  /^I-H/,
  /^G-H/,
  /^OO-H/,
  /^PH-H/,
  /^OE-X/,
  /^ZS-H/,
  /^VH-H/,
  /^JA7/,
  /^JA6/
];

const TAIL_NUMBER_PATTERNS = [
  /^N\d{1,5}[A-Z]{0,2}$/,
  /^(D|F|HB|I|OO|PH|SE|LN|OY|CS|EC|EI|SU|UR|RA|SP|HA|TC|SX|TF|YL|YR|YU|LX|4X|9H|ZS|ZU|VH|JA|HL|B|PK|PR)-?[A-Z0-9]{2,5}$/
];

const AIRLINE_KEYWORDS = [
  "AIR",
  "AIRLINES",
  "AIRWAYS",
  "LINEA",
  "AVIA",
  "FLY",
  "WINGS",
  "JET",
  "COMPAGNIE"
];

const COMMERCIAL_CALLSIGN_PATTERN = /^[A-Z]{2,3}\d{1,4}$/;

function inferCategoryType(category) {
  const value = Number(category);
  if (!Number.isFinite(value)) {
    return null;
  }
  if (value === 7) {
    return "heli";
  }
  if (value === 6) {
    return "jet";
  }
  if (value >= 3 && value <= 5) {
    return "airliner";
  }
  if (value === 1 || value === 2 || value === 8 || value === 9) {
    return "light";
  }
  return null;
}

function normalizeCallsign(value) {
  return (value || "").toString().replace(/\s+/g, "").toUpperCase();
}

function hasAirlinePrefix(callsign) {
  return AIRLINE_CALLSIGN_PREFIXES.some((prefix) => callsign.startsWith(prefix));
}

function looksLikeTailNumber(callsign) {
  return TAIL_NUMBER_PATTERNS.some((regex) => regex.test(callsign));
}

function looksLikeHelicopterCallsign(callsign) {
  if (!callsign) {
    return false;
  }
  if (HELI_CALLSIGN_PREFIXES.some((prefix) => callsign.startsWith(prefix))) {
    return true;
  }
  return HELI_REGISTRATION_PATTERNS.some((regex) => regex.test(callsign));
}

function looksLikeCommercialCallsign(callsign) {
  if (!callsign) {
    return false;
  }
  return COMMERCIAL_CALLSIGN_PATTERN.test(callsign);
}

function hasAirlineKeyword(name) {
  if (!name) {
    return false;
  }
  const upper = name.toUpperCase();
  return AIRLINE_KEYWORDS.some((keyword) => upper.includes(keyword));
}

function getAltitudeMeters(flight) {
  const altitude =
    Number(flight.altitudeMeters ?? flight.altitude ?? flight.altitudeFeet ?? 0) || 0;
  return altitude;
}

function getSpeedKmh(flight) {
  const speedKmh = Number(flight.speedKmh);
  if (Number.isFinite(speedKmh)) {
    return speedKmh;
  }
  const liveSpeed = Number(flight.speed);
  if (Number.isFinite(liveSpeed) && liveSpeed > 0) {
    return liveSpeed;
  }
  const velocityMs = Number(flight.velocityMs ?? flight.speedMs ?? 0);
  if (Number.isFinite(velocityMs) && velocityMs > 0) {
    return velocityMs * 3.6;
  }
  return 0;
}

function determineFlightType(flight) {
  const callsign = normalizeCallsign(flight.callsign || flight.flightNumber);
  const altitude = getAltitudeMeters(flight);
  const altitudeFeet = altitude * 3.28084;
  const speed = getSpeedKmh(flight);
  const airlineName = (flight.airline || "").trim();
  const airlineKnown =
    hasAirlinePrefix(callsign) ||
    looksLikeCommercialCallsign(callsign) ||
    Boolean(airlineName) ||
    hasAirlineKeyword(airlineName);
  const tailNumber = looksLikeTailNumber(callsign);
  const isHelicopter =
    looksLikeHelicopterCallsign(callsign) ||
    (altitude < 1000 && speed < 180 && callsign.startsWith("H"));
  const categoryHint = inferCategoryType(flight.category);
  if (categoryHint) {
    return categoryHint;
  }
  if (isHelicopter) {
    return "heli";
  }
  if (airlineKnown) {
    return "airliner";
  }
  if (tailNumber && altitudeFeet > 20000 && speed > 500) {
    return "jet";
  }
  if (tailNumber && altitudeFeet < 12000 && speed < 450) {
    return "light";
  }
  if (speed >= 620 && altitudeFeet >= 22000) {
    return "jet";
  }
  if (altitudeFeet <= 8000 && speed <= 360) {
    return "light";
  }
  if (looksLikeCommercialCallsign(callsign)) {
    return "airliner";
  }
  return "airliner";
}

function matchesFlightType(flight, type) {
  if (type === "all") {
    return true;
  }
  const hint = flight.typeHint || determineFlightType(flight);
  return hint === type;
}

function filterFlightsByType(flights, type) {
  if (!Array.isArray(flights) || flights.length === 0) {
    return [];
  }
  return flights.filter((flight) => matchesFlightType(flight, type));
}

function computeLimit(rawCount, availableCount) {
  if (availableCount === 0) {
    return 0;
  }
  const raw = Number(rawCount);
  if (!Number.isFinite(raw)) {
    return availableCount;
  }
  const safe = Math.max(0, raw);
  if (safe === 0) {
    return 0;
  }
  return Math.min(safe, availableCount);
}

export function convertLatLonToXYZ(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return { x, y, z };
}

export async function fetchLiveFlights() {
  const response = await fetch(BACKEND_POSITIONS_URL, {
    method: "GET"
  });
  if (!response.ok) {
    throw new Error("Flight feed unavailable");
  }
  const json = await response.json();
  const positions = Array.isArray(json.positions) ? json.positions : [];
  const flights = positions
    .filter((item) => item.latitude != null && item.longitude != null)
    .map((item) => {
      const altitudeMeters = item.altitude ?? 0;
      const velocityMs = item.velocity ?? 0;
      const base = {
        id: item.id,
        icao24: item.icao24,
        callsign: (item.callsign || "").trim(),
        originCountry: item.originCountry || "",
        longitude: item.longitude,
        latitude: item.latitude,
        altitudeMeters,
        velocityMs,
        heading: item.heading ?? 0,
        category: item.category ?? 0,
        departureAirport: item.departureAirport || "",
        arrivalAirport: item.arrivalAirport || "",
        airline: item.airline || "",
        status: item.status || "Terminé",
        timePosition: item.timePosition || item.lastContact || null
      };
      return {
        ...base,
        typeHint: determineFlightType(base)
      };
    });
  return flights;
}

export async function fetchFlightTrack(icao24, timeSeconds) {
  const query = Number.isFinite(timeSeconds)
    ? `?time=${encodeURIComponent(Math.floor(timeSeconds))}`
    : "";
  const response = await fetch(`${BACKEND_TRACK_URL}/${encodeURIComponent(icao24)}${query}`, {
    method: "GET"
  });
  if (!response.ok) {
    throw new Error("Track unavailable");
  }
  const json = await response.json();
  const track = Array.isArray(json.track) ? json.track : [];
  return track.filter((point) => {
    const lat = Number(point.latitude);
    const lon = Number(point.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return false;
    }
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return false;
    }
    // Remove bogus (0,0) entries that sit in the ocean
    if (Math.abs(lat) < 0.01 && Math.abs(lon) < 0.01) {
      return false;
    }
    return true;
  });
}

async function fetchAircraftPhoto(icao24) {
  if (!icao24) {
    return null;
  }
  try {
    const response = await fetch(`/api/aircraft/photo/${encodeURIComponent(icao24)}`);
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data?.photo || null;
  } catch (error) {
    return null;
  }
}

export const useFlightsStore = create((set, get) => ({
  flights: [],
  visibleFlights: [],
  filteredFlights: [],
  availableCount: 0,
  hasAppliedFilters: false,
  filters: {
    type: "all",
    count: 300
  },
  lastUpdate: null,
  selectedFlight: null,
  focusRequestId: 0,
  trackPoints: [],
  aircraftPhoto: null,
  loadingFlights: false,
  loadingTrack: false,
  error: null,
  _intervalId: null,
  applyFilters() {
    const { flights, filters } = get();
    const filtered = filterFlightsByType(flights, filters.type);
    const availableCount = filtered.length;
    const shouldHideAll = Number(filters.count) === 0;
    let selected = filtered;
    if (availableCount === 0 || shouldHideAll) {
      selected = [];
    } else {
      const limit = computeLimit(filters.count, availableCount);
      selected = limit > 0 ? filtered.slice(0, limit) : filtered;
    }
    set({
      visibleFlights: selected,
      filteredFlights: filtered,
      availableCount,
      hasAppliedFilters: true
    });
  },
  async refreshFlights() {
    set({ loadingFlights: true, error: null });
    try {
      const flights = await fetchLiveFlights();
      set({
        flights,
        lastUpdate: Date.now(),
        loadingFlights: false
      });
      get().applyFilters();
    } catch (error) {
      set({
        loadingFlights: false,
        error: error.message || "Unable to load flights."
      });
    }
  },
  setFilterType(type) {
    const current = get().filters;
    set({
      filters: {
        ...current,
        type
      }
    });
    get().applyFilters();
  },
  setFilterCount(count) {
    const current = get().filters;
    const raw = Number(count);
    const value = Number.isFinite(raw) ? Math.max(0, raw) : 0;
    set({
      filters: {
        ...current,
        count: value
      }
    });
    get().applyFilters();
  },
  async selectFlight(flight) {
    if (!flight || !flight.icao24) {
      set({ selectedFlight: null, trackPoints: [], aircraftPhoto: null, focusRequestId: Date.now() });
      return;
    }
    set({
      selectedFlight: flight,
      trackPoints: [],
      aircraftPhoto: null,
      loadingTrack: true,
      error: null,
      focusRequestId: Date.now()
    });
    try {
      const [trackPoints, aircraftPhoto] = await Promise.all([
        fetchFlightTrack(
          flight.icao24,
          flight.timePosition ? Math.floor(flight.timePosition) : undefined
        ),
        fetchAircraftPhoto(flight.icao24)
      ]);
      set({
        trackPoints,
        aircraftPhoto,
        loadingTrack: false
      });
    } catch (error) {
      set({
        loadingTrack: false,
        aircraftPhoto: null,
        error: error.message || "Unable to load track."
      });
    }
  },
  clearSelection() {
    set({
      selectedFlight: null,
      trackPoints: [],
      focusRequestId: Date.now()
    });
  },
  updateFlightsLoop() {
    const current = get()._intervalId;
    if (current) {
      return;
    }
    const run = async () => {
      try {
        await get().refreshFlights();
      } catch {
      }
    };
    run();
    const id = setInterval(run, 1000);
    set({ _intervalId: id });
  },
  stopFlightsLoop() {
    const current = get()._intervalId;
    if (current) {
      clearInterval(current);
      set({ _intervalId: null });
    }
  }
}));
