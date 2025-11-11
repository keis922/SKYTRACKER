// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import { Router } from "express";
import { registerUser, loginUser } from "../services/authService.js";

const router = Router();

router.post("/signup", async (req, res) => {
  const { email, password } = req.body || {};
  const { user, token } = await registerUser(email, password);
  res.json({ user, token });
});

router.post("/login", async (req, res) => {
  const { identifier, password } = req.body || {};
  const { user, token } = await loginUser(identifier, password);
  res.json({ user, token });
});

export default router;
