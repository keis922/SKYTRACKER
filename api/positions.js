import { fetchOpenSkyStates } from "./_opensky.js";

// keis: route positions -> map brut
export default async function handler(req, res) {
  try {
    const payload = await fetchOpenSkyStates();
    const states = Array.isArray(payload?.states) ? payload.states : [];
    const positions = states.map((row) => ({
      icao24: row[0] || null,
      callsign: (row[1] || "").trim(),
      originCountry: row[2] || "",
      timePosition: row[3],
      lastContact: row[4],
      longitude: row[5],
      latitude: row[6],
      baroAltitude: row[7],
      onGround: row[8],
      velocity: row[9],
      trueTrack: row[10],
      verticalRate: row[11],
      sensors: row[12],
      geoAltitude: row[13],
      squawk: row[14],
      spi: row[15],
      positionSource: row[16],
      category: row[17]
    }));
    res.status(200).json({ positions, time: payload?.time });
  } catch (error) {
    const status = error.response?.status;
    const message =
      error.response?.data?.error ||
      error.message ||
      "OpenSky unavailable";
    res.status(200).json({
      positions: [],
      error: message,
      upstreamStatus: status || null
    });
  }
}
