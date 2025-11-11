import { fetchOpenSkyStates } from "./_opensky.js";

// keis: route vols -> map data simple
export default async function handler(req, res) {
  try {
    const payload = await fetchOpenSkyStates();
    const states = Array.isArray(payload?.states) ? payload.states : [];
    const flights = states
      .map((row) => {
        const callsign = (row[1] || "").trim();
        return {
          id: row[0] || callsign || `flight-${Math.random().toString(36).slice(2, 8)}`,
          icao24: row[0] || null,
          callsign,
          flightNumber: callsign,
          originCountry: row[2] || "",
          longitude: row[5],
          latitude: row[6],
          altitude: row[13] ?? row[7],
          velocity: row[9],
          heading: row[10],
          updatedAt: row[4] || row[3] || payload?.time || null
        };
      })
      .filter((f) => f.latitude != null && f.longitude != null);
    res.status(200).json({ flights, time: payload?.time });
  } catch (error) {
    const status = error.response?.status;
    const message =
      error.response?.data?.error ||
      error.message ||
      "OpenSky unavailable";
    res.status(200).json({
      flights: [],
      error: message,
      upstreamStatus: status || null
    });
  }
}
