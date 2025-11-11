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
  const photo = await getAircraftPhoto(req.params.icao24);
  res.json({ photo });
});

export default router;
