import { Router } from "express";
import { getPositions } from "../services/flightsService.js";

const router = Router();

// tristan: get positions
router.get("/", async (req, res) => {
  try {
    const positions = await getPositions();
    res.json({ positions });
  } catch (error) {
    res.status(500).json({ error: "Unable to fetch positions" });
  }
});

export default router;
