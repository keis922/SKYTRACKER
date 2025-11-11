import "./config/env.js";
import express from "express";
import cors from "cors";
import flightsRouter from "./routes/flights.js";
import positionsRouter from "./routes/positions.js";
import favoritesRouter from "./routes/favorites.js";
import tracksRouter from "./routes/tracks.js";
import aircraftRouter from "./routes/aircraft.js";
import localAuthRouter from "./routes/localAuth.js";
import { initFlightUpdates, initPositionUpdates } from "./services/flightsService.js";

const app = express();
const port = process.env.PORT || 3000;
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

// keis: cors + json
app.use(
  cors({
    origin: clientUrl,
    credentials: true
  })
);
app.use(express.json());

// keis: routes api
app.use("/api/flights", flightsRouter);
app.use("/api/positions", positionsRouter);
app.use("/api/favorites", favoritesRouter);
app.use("/api/tracks", tracksRouter);
app.use("/api/aircraft", aircraftRouter);
app.use("/api/local-auth", localAuthRouter);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// keis: start + jobs
app.listen(port, () => {
  initFlightUpdates();
  initPositionUpdates();
});
