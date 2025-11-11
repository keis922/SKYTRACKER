// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import "./config/env.js";
import express from "express";
import cors from "cors";
import flightsRouter from "./routes/flights.js";
import positionsRouter from "./routes/positions.js";

const app = express();
const port = process.env.PORT || 3000;
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

app.use(cors({ origin: clientUrl, credentials: true }));
app.use(express.json());

app.use("/api/flights", flightsRouter);
app.use("/api/positions", positionsRouter);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(port);
