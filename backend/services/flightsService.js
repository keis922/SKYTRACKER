import axios from "axios";
import { readCache, writeCache } from "./cacheStore.js";

let flightsCache = [];
let positionsCache = [];
let lastFlightsUpdate = 0;
let lastPositionsUpdate = 0;
let openSkyToken = null;
let openSkyTokenExpiresAt = 0;
const registrationPhotoCache = new Map();
let recentFlightsAirportMap = new Map();
let lastAirportMapUpdate = 0;
let pendingPositionsRefresh = null;
const airportFlightsCache = new Map();
const airportFlightsCacheMs = 2 * 60 * 1000;

const updateIntervalMs = 5000;
const openSkyStatesUrl =
  process.env.OPENSKY_URL || "https://opensky-network.org/api/states/all";
const openSkyTokenUrl =
  "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token";
const openSkyTracksUrl =
  "https://opensky-network.org/api/tracks/all";
const openSkyFlightsArrivalUrl =
  "https://opensky-network.org/api/flights/arrival";
const openSkyFlightsDepartureUrl =
  "https://opensky-network.org/api/flights/departure";
const openSkyMetadataUrl =
  "https://opensky-network.org/api/metadata/aircraft/icao24";
const openSkyRegistrationMetadataUrl =
  "https://opensky-network.org/api/metadata/aircraft/registration";
const planeSpottersUrl =
  "https://api.planespotters.net/pub/photos/hex";
const planeSpottersRegUrl =
  "https://api.planespotters.net/pub/photos/registration";
const openSkyFlightsAllUrl =
  "https://opensky-network.org/api/flights/all";
const airportMapRefreshMs = 60000;

// keis: sécurise http en https
function sanitizeImageUrl(url) {
  if (!url) {
    return null;
  }
  if (url.startsWith("http://")) {
    return `https://${url.slice("http://".length)}`;
  }
  return url;
}

// keis: pick meilleure image metadata
function extractImageFromMetadata(metadata) {
  if (!metadata) {
    return null;
  }
  const image = metadata.image || metadata.images?.[0];
  if (!image) {
    return null;
  }
  const candidates = [
    image.url,
    image.link,
    image.web,
    image.thumbnail,
    image?.sizes?.large,
    image?.sizes?.medium
  ].filter((value) => typeof value === "string" && value.length > 0);
  return sanitizeImageUrl(candidates[0] || null);
}

// keis: map vols recents->aeroports
async function fetchRecentFlightsAirportMap() {
  const end = Math.floor(Date.now() / 1000);
  const begin = end - 3600;
  try {
    const headers = {};
    const token = await getOpenSkyAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const response = await axios.get(openSkyFlightsAllUrl, {
      timeout: 10000,
      headers,
      params: { begin, end }
    });
    const flights = Array.isArray(response.data) ? response.data : [];
    const map = new Map();
    flights.forEach((flight) => {
      const key = (flight.icao24 || "").trim().toLowerCase();
      if (!key) {
        return;
      }
      map.set(key, {
        departure: flight.estDepartureAirport || "",
        arrival: flight.estArrivalAirport || ""
      });
    });
    return map;
  } catch (error) {
    const status = error.response?.status;
    if (status === 429) {
      console.warn("OpenSky flights/all rate limit hit, skipping refresh");
    } else {
      console.error("OpenSky flights/all fetch failed:", status || error.message);
    }
    return new Map();
  }
}

// keis: charge cache ou refresh
async function ensureRecentFlightsAirportMap() {
  if (
    recentFlightsAirportMap.size === 0 ||
    Date.now() - lastAirportMapUpdate > airportMapRefreshMs
  ) {
    const cached = await readCache("recentFlightsAirportMap");
    if (cached && Array.isArray(cached.entries)) {
      recentFlightsAirportMap = new Map(cached.entries);
      lastAirportMapUpdate = cached.timestamp || 0;
    }
  }
  if (
    recentFlightsAirportMap.size === 0 ||
    Date.now() - lastAirportMapUpdate > airportMapRefreshMs
  ) {
    const map = await fetchRecentFlightsAirportMap();
    if (map.size > 0) {
      recentFlightsAirportMap = map;
      lastAirportMapUpdate = Date.now();
      await writeCache("recentFlightsAirportMap", {
        entries: Array.from(map.entries()),
        timestamp: lastAirportMapUpdate
      });
    }
  }
}

// keis: merge infos aero sur position
function mergeAirportsFromMap(position) {
  const key = (position.icao24 || "").trim().toLowerCase();
  const info = key ? recentFlightsAirportMap.get(key) : null;
  if (!info) {
    return position;
  }
  return {
    ...position,
    departureAirport: position.departureAirport || info.departure || "",
    arrivalAirport: position.arrivalAirport || info.arrival || ""
  };
}

// keis: map flights arrival/dep
function mapOpenSkyAirportFlight(entry, type) {
  if (!entry) {
    return null;
  }
  const callsign = (entry.callsign || "").trim();
  return {
    id: `${entry.icao24 || "flight"}-${entry.firstSeen || entry.lastSeen || Date.now()}-${type}`,
    icao24: entry.icao24 || null,
    callsign,
    flightNumber: callsign,
    departureAirport: entry.estDepartureAirport || "",
    arrivalAirport: entry.estArrivalAirport || "",
    departureTime: entry.firstSeen || null,
    arrivalTime: entry.lastSeen || null
  };
}

// keis: fetch vols aero avec cache
async function fetchAirportFlightsFromOpenSky(airportCode, direction) {
  if (!airportCode) {
    return [];
  }
  const normalized = airportCode.trim().toUpperCase();
  if (!normalized || normalized.length < 3) {
    return [];
  }
  const pattern = /^[A-Z0-9]{3,4}$/;
  if (!pattern.test(normalized)) {
    return [];
  }
  const end = Math.floor(Date.now() / 1000);
  const begin = end - 2 * 3600;
  const cacheKey = `${normalized}-${direction}`;
  const cached = airportFlightsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < airportFlightsCacheMs) {
    return cached.data;
  }
  const headers = {};
  const token = await getOpenSkyAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const baseUrl =
    direction === "arrival" ? openSkyFlightsArrivalUrl : openSkyFlightsDepartureUrl;
  try {
    const response = await axios.get(baseUrl, {
      timeout: 10000,
      headers,
      params: {
        airport: normalized,
        begin,
        end
      }
    });
    const list = Array.isArray(response.data) ? response.data : [];
    const mapped = list
      .map((entry) => mapOpenSkyAirportFlight(entry, direction))
      .filter(Boolean);
    airportFlightsCache.set(cacheKey, {
      data: mapped,
      timestamp: Date.now()
    });
    return mapped;
  } catch (error) {
    const status = error.response?.status;
    if (status && status !== 404 && status !== 429) {
      console.error(`OpenSky ${direction} flights fetch failed for ${normalized}:`, status);
    }
    if (cached) {
      return cached.data;
    }
    return [];
  }
}

// keis: metadata via immat
async function fetchAircraftMetadataByRegistration(registration) {
  if (!registration) {
    return null;
  }
  try {
    const response = await axios.get(
      `${openSkyRegistrationMetadataUrl}/${encodeURIComponent(registration.trim())}`,
      {
        timeout: 8000
      }
    );
    return response.data || null;
  } catch {
    return null;
  }
}

// keis: choisi temps dispo
function selectTime(details) {
  if (!details) {
    return null;
  }
  return (
    details.actual ||
    details.estimated ||
    details.scheduled ||
    details.departure_time ||
    details.arrival_time ||
    null
  );
}

// keis: normalise vols aviationstack
function normalizeFlights(raw) {
  if (!raw || !Array.isArray(raw.data)) {
    return [];
  }
  return raw.data
    .map((item, index) => {
      const flightNumber = item.flight?.iata || item.flight?.icao || "";
      const registration = (item.aircraft?.registration || "").trim();
      const departureIata = (item.departure?.iata || "").trim();
      const departureIcao = (item.departure?.icao || "").trim();
      const arrivalIata = (item.arrival?.iata || "").trim();
      const arrivalIcao = (item.arrival?.icao || "").trim();
      const idSource =
        flightNumber ||
        registration ||
        item.airline?.iata ||
        `flight-${index}`;
      const id = `${idSource}-${item.flight_date || ""}-${index}`;
      const latitude = item.live?.latitude ?? null;
      const longitude = item.live?.longitude ?? null;
      if (latitude == null || longitude == null) {
        return null;
      }
      return {
        id,
        flightNumber,
        flightKey:
          (item.flight?.iata || item.flight?.icao || "")
            .toString()
            .replace(/\s+/g, "")
            .toUpperCase(),
        icao24: null,
        aircraftRegistration: registration || null,
        airline: item.airline?.name || "",
        status: item.flight_status || "Terminé",
        departureAirport: item.departure?.airport || "",
        departureIata,
        departureIcao,
        departureCountry: item.departure?.country || "",
        arrivalAirport: item.arrival?.airport || "",
        arrivalIata,
        arrivalIcao,
        arrivalCountry: item.arrival?.country || "",
        departureTime: selectTime(item.departure),
        arrivalTime: selectTime(item.arrival),
        latitude,
        longitude,
        altitude: item.live?.altitude ?? null,
        speed: item.live?.speed_horizontal ?? null,
        imageUrl: null
      };
    })
    .filter(Boolean);
}

// keis: normalise positions opensky
function normalizePositions(raw) {
  if (!raw || !Array.isArray(raw.states)) {
    return [];
  }
  return raw.states
    .map((state) => {
      const [
        icao24,
        callsign,
        originCountry,
        ,
        ,
        longitude,
        latitude,
        baroAltitude,
        onGround,
        velocity,
        heading,
        ,
        ,
        ,
        ,
        ,
        ,
        category
      ] = state;
      if (latitude == null || longitude == null) {
        return null;
      }
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
        timePosition: state[3] || state[4] || null,
        category
      };
    })
    .filter(Boolean);
}

// keis: ajoute infos vols aux positions
function enrichPositionsWithFlights(positions) {
  if (!positions || positions.length === 0 || flightsCache.length === 0) {
    return positions;
  }
  const flightIndex = new Map();
  flightsCache.forEach((flight) => {
    const key = flight.flightKey;
    if (key) {
      flightIndex.set(key, flight);
    }
  });
  return positions.map((position) => {
    const key = position.callsignKey || (position.callsign || "").replace(/\s+/g, "").toUpperCase();
    const fallbackKey = (position.icao24 || "").toUpperCase();
    const match = flightIndex.get(key) || flightIndex.get(fallbackKey);
    if (!match) {
      return position;
    }
    return {
      ...position,
      departureAirport: match.departureAirport || "",
      departureCountry: match.departureCountry || match.originCountry || "",
      arrivalAirport: match.arrivalAirport || "",
      arrivalCountry: match.arrivalCountry || "",
      airline: match.airline || "",
      status: match.status || ""
    };
  });
}

// keis: token opensky client cred
async function getOpenSkyAccessToken() {
  const clientId = process.env.OPENSKY_CLIENT_ID;
  const clientSecret = process.env.OPENSKY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return null;
  }
  if (openSkyToken && Date.now() < openSkyTokenExpiresAt - 60000) {
    return openSkyToken;
  }
  const body = new URLSearchParams();
  body.append("grant_type", "client_credentials");
  body.append("client_id", clientId);
  body.append("client_secret", clientSecret);
  try {
    const response = await axios.post(openSkyTokenUrl, body.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      timeout: 10000
    });
    const token = response.data && response.data.access_token;
    if (!token) {
      return null;
    }
    const expiresIn = response.data.expires_in || 1800;
    openSkyToken = token;
    openSkyTokenExpiresAt = Date.now() + expiresIn * 1000;
    return token;
  } catch {
    return null;
  }
}

// keis: vols depuis aviationstack
async function fetchFlightsFromAviationStack() {
  const key = process.env.AVIATIONSTACK_KEY;
  if (!key) {
    return [];
  }
  try {
    const response = await axios.get("http://api.aviationstack.com/v1/flights", {
      params: {
        access_key: key,
        limit: 100,
        flight_status: "active"
      },
      timeout: 10000
    });
    const flights = normalizeFlights(response.data);
    return flights;
  } catch (error) {
    return [];
  }
}

// keis: positions depuis opensky
async function fetchPositionsFromOpenSky() {
  try {
    const headers = {};
    const token = await getOpenSkyAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const response = await axios.get(openSkyStatesUrl, {
      timeout: 10000,
      headers
    });
    const positions = normalizePositions(response.data);
    await ensureRecentFlightsAirportMap();
    const withAirports = positions.map(mergeAirportsFromMap);
    return enrichPositionsWithFlights(withAirports);
  } catch (error) {
    const status = error.response?.status;
    if (status === 429) {
      console.warn("OpenSky rate limit reached, serving cached positions");
      return positionsCache;
    }
    console.error("OpenSky positions fetch failed:", status || error.message);
    return positionsCache;
  }
}

// keis: track opensky
async function fetchTrackFromOpenSky(icao24, timeSeconds = Math.floor(Date.now() / 1000)) {
  if (!icao24) {
    return [];
  }
  try {
    const headers = {};
    const token = await getOpenSkyAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const response = await axios.get(openSkyTracksUrl, {
      timeout: 10000,
      headers,
      params: {
        icao24,
        time: timeSeconds
      }
    });
    const path = Array.isArray(response.data.path) ? response.data.path : [];
    return path
      .filter(
        (segment) =>
          Array.isArray(segment) &&
          segment.length >= 3 &&
          typeof segment[1] === "number" &&
          typeof segment[2] === "number"
      )
      .map((segment) => ({
        latitude: segment[1],
        longitude: segment[2],
        altitudeMeters: segment[3] ?? 0
      }));
  } catch {
    console.error("OpenSky track fetch failed for", icao24);
    return [];
  }
}

// keis: metadata avion par icao
async function fetchAircraftMetadata(icao24) {
  if (!icao24) {
    return null;
  }
  try {
    const response = await axios.get(
      `${openSkyMetadataUrl}/${encodeURIComponent(icao24)}`,
      {
        timeout: 8000
      }
    );
    return response.data || null;
  } catch (error) {
    return null;
  }
}

// keis: photo via hex
async function fetchPlaneSpottersPhoto(icao24) {
  if (!icao24) {
    return null;
  }
  try {
    const response = await axios.get(
      `${planeSpottersUrl}/${encodeURIComponent(icao24.toLowerCase())}`,
      {
        timeout: 8000
      }
    );
    const photos = Array.isArray(response.data?.photos) ? response.data.photos : [];
    if (photos.length === 0) {
      return null;
    }
    const details = photos[0]?.thumbnail || photos[0]?.sizes?.large || photos[0]?.link;
    if (typeof details === "string") {
      return sanitizeImageUrl(details);
    }
    return sanitizeImageUrl(photos[0]?.thumbnail?.src || photos[0]?.img || null);
  } catch (error) {
    return null;
  }
}

// keis: photo via immat
async function fetchPlaneSpottersPhotoByRegistration(registration) {
  if (!registration) {
    return null;
  }
  const normalized = registration.replace(/\s+/g, "").toUpperCase();
  if (registrationPhotoCache.has(normalized)) {
    return registrationPhotoCache.get(normalized);
  }
  try {
    const response = await axios.get(
      `${planeSpottersRegUrl}/${encodeURIComponent(normalized)}`,
      {
        timeout: 8000
      }
    );
    const photos = Array.isArray(response.data?.photos) ? response.data.photos : [];
    if (photos.length === 0) {
      registrationPhotoCache.set(normalized, null);
      return null;
    }
    const entry = photos[0];
    const candidates = [
      entry.thumbnail?.src,
      entry.thumbnail,
      entry.img,
      entry.link,
      entry.sizes?.large?.src,
      entry.sizes?.medium?.src
    ].filter((value) => typeof value === "string");
    const result = sanitizeImageUrl(candidates[0] || null);
    registrationPhotoCache.set(normalized, result);
    return result;
  } catch {
    registrationPhotoCache.set(normalized, null);
    return null;
  }
}

// keis: enrichit vols avec photos
async function enrichFlightsWithPhotos(flights) {
  for (const flight of flights) {
    if (flight.imageUrl) {
      continue;
    }
    let linkedPosition =
      positionsCache.find((position) => {
        if (!position) {
          return false;
        }
        const key =
          position.callsignKey || (position.callsign || "").replace(/\s+/g, "").toUpperCase();
        return key && flight.flightKey && key === flight.flightKey;
      }) || null;
    let aircraftHex = flight.icao24 || linkedPosition?.icao24 || null;
    if (aircraftHex) {
      flight.icao24 = aircraftHex;
      const metadata = await fetchAircraftMetadata(aircraftHex);
      const metadataImage = extractImageFromMetadata(metadata);
      if (metadataImage) {
        flight.imageUrl = metadataImage;
        continue;
      }
      const photoFromHex = await fetchPlaneSpottersPhoto(aircraftHex);
      if (photoFromHex) {
        flight.imageUrl = photoFromHex;
        continue;
      }
    }
    if (flight.aircraftRegistration) {
      const metadataByReg = await fetchAircraftMetadataByRegistration(flight.aircraftRegistration);
      const imageFromReg = extractImageFromMetadata(metadataByReg);
      if (imageFromReg) {
        flight.imageUrl = imageFromReg;
        flight.icao24 = flight.icao24 || metadataByReg?.icao24 || metadataByReg?.hex;
        continue;
      }
      if (!aircraftHex && metadataByReg?.icao24) {
        aircraftHex = metadataByReg.icao24;
        flight.icao24 = aircraftHex;
        const metadataFromHex = await fetchAircraftMetadata(aircraftHex);
        const imgFromHex = extractImageFromMetadata(metadataFromHex);
        if (imgFromHex) {
          flight.imageUrl = imgFromHex;
          continue;
        }
        const photoFromHex = await fetchPlaneSpottersPhoto(aircraftHex);
        if (photoFromHex) {
          flight.imageUrl = photoFromHex;
          continue;
        }
      }
      const photo = await fetchPlaneSpottersPhotoByRegistration(flight.aircraftRegistration);
      if (photo) {
        flight.imageUrl = photo;
      }
    }
  }
}

// keis: stub persist local
async function persistSnapshot() {}

// keis: refresh vols + photos
async function refreshFlights() {
  const flights = await fetchFlightsFromAviationStack();
  if (flights.length > 0) {
    if (Date.now() - lastPositionsUpdate > updateIntervalMs) {
      await schedulePositionsRefresh();
    }
    await enrichFlightsWithPhotos(flights);
    flightsCache = flights;
    lastFlightsUpdate = Date.now();
    await persistSnapshot("flight_logs", flights);
  }
}

// keis: refresh positions + photos vols
async function refreshPositions() {
  const positions = await fetchPositionsFromOpenSky();
  if (positions.length > 0) {
    positionsCache = positions;
    lastPositionsUpdate = Date.now();
    await persistSnapshot("position_logs", positions);
    if (flightsCache.length > 0) {
      await enrichFlightsWithPhotos(flightsCache);
    }
  }
}

// keis: throttle refresh positions
function schedulePositionsRefresh() {
  if (!pendingPositionsRefresh) {
    pendingPositionsRefresh = refreshPositions()
      .catch((error) => {
        console.error("Positions refresh failed:", error?.message || error);
      })
      .finally(() => {
        pendingPositionsRefresh = null;
      });
  }
  return pendingPositionsRefresh;
}

// keis: getter vols avec refresh auto
export async function getFlights() {
  if (Date.now() - lastFlightsUpdate > updateIntervalMs) {
    await refreshFlights();
  }
  return flightsCache;
}

// keis: getter positions avec refresh auto
export async function getPositions() {
  if (positionsCache.length === 0) {
    await schedulePositionsRefresh();
    return positionsCache;
  }
  if (Date.now() - lastPositionsUpdate > updateIntervalMs) {
    schedulePositionsRefresh();
  }
  return positionsCache;
}

// keis: vols par aeroport
export async function getFlightsForAirport(airportCode) {
  if (!airportCode) {
    return { arrivals: [], departures: [] };
  }
  const [arrivals, departures] = await Promise.all([
    fetchAirportFlightsFromOpenSky(airportCode, "arrival"),
    fetchAirportFlightsFromOpenSky(airportCode, "departure")
  ]);
  return {
    arrivals,
    departures
  };
}

// keis: track avion
export async function getTrackForAircraft(icao24, timeSeconds) {
  const track = await fetchTrackFromOpenSky(icao24, timeSeconds);
  return track;
}

// keis: photo avion
export async function getAircraftPhoto(icao24) {
  const metadata = await fetchAircraftMetadata(icao24);
  if (metadata) {
    const image = metadata.image || {};
    const url = image.url || image.web || image.thumbnail || null;
    if (url) {
      return url;
    }
  }
  const fallback = await fetchPlaneSpottersPhoto(icao24);
  return fallback;
}

// keis: init cron vols
export function initFlightUpdates() {
  refreshFlights();
  setInterval(refreshFlights, updateIntervalMs);
}

// keis: init cron positions
export function initPositionUpdates() {
  schedulePositionsRefresh();
  setInterval(() => {
    schedulePositionsRefresh();
  }, updateIntervalMs);
}
