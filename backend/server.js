// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import express from "express";

const app = express();
const port = process.env.PORT || 3000;

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(port);
