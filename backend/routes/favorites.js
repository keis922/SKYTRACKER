// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import { Router } from "express";
import { getUserFromRequest } from "../services/authService.js";
import { getFavorites, toggleFavorite } from "../services/favoritesService.js";

const router = Router();

router.get("/", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const favorites = await getFavorites(user.id);
  res.json({ favorites });
});

router.post("/", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const favorites = await toggleFavorite(user.id, req.body.flight);
  res.json({ favorites });
});

export default router;
