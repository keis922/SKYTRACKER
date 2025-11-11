// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import { Router } from "express";
import { getPositions } from "../services/flightsService.js";

const router = Router();

router.get("/", async (req, res) => {
  const positions = await getPositions();
  res.json({ positions });
});

export default router;
