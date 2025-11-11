// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import { Router } from "express";
import { getFlights, getFlightsForAirport } from "../services/flightsService.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const flights = await getFlights();
    res.json({ flights });
  } catch (error) {
    res.status(500).json({ error: "Unable to fetch flights" });
  }
});

router.get("/airport/:code", async (req, res) => {
  const { code } = req.params;
  if (!code) {
    res.status(400).json({ error: "Airport code is required" });
    return;
  }
  try {
    const flights = await getFlightsForAirport(code);
    res.json(flights);
  } catch (error) {
    res.status(500).json({ error: "Unable to fetch airport flights" });
  }
});

export default router;
