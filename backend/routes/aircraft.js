// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import { Router } from "express";
import { getAircraftPhoto } from "../services/flightsService.js";

const router = Router();

router.get("/photo/:icao24", async (req, res) => {
  const { icao24 } = req.params;
  if (!icao24) {
    return res.status(400).json({ error: "Missing icao24" });
  }
  try {
    const photo = await getAircraftPhoto(icao24);
    if (!photo) {
      return res.status(404).json({ error: "Photo indisponible" });
    }
    res.json({ photo });
  } catch (error) {
    res.status(500).json({ error: "Unable to fetch aircraft photo" });
  }
});

export default router;
