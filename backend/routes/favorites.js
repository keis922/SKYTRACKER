// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import { Router } from "express";
import { getFavorites, toggleFavorite } from "../services/favoritesService.js";

const router = Router();

router.get("/", async (req, res) => {
  const favorites = await getFavorites(req.query.userId);
  res.json({ favorites });
});

router.post("/", async (req, res) => {
  const favorites = await toggleFavorite(req.body.userId, req.body.flight);
  res.json({ favorites });
});

export default router;
