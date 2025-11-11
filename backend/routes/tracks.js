// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import { Router } from "express";
import { getTrackForAircraft } from "../services/flightsService.js";

const router = Router();

router.get("/:icao24", async (req, res) => {
  const { icao24 } = req.params;
  const timeParam = Number(req.query.time);
  const timeSeconds = Number.isFinite(timeParam) ? Math.floor(timeParam) : undefined;
  if (!icao24) {
    return res.status(400).json({ error: "Missing icao24" });
  }
  try {
    const track = await getTrackForAircraft(icao24, timeSeconds);
    res.json({ track });
  } catch (error) {
    res.status(500).json({ error: "Unable to fetch track" });
  }
});

export default router;
