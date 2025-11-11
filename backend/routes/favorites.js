import { Router } from "express";
import { getUserFromRequest } from "../services/authService.js";
import {
  getFavorites,
  toggleFavorite,
  setFavoriteStatus,
  addFavoriteByCode,
  removeFavorite
} from "../services/favoritesService.js";

const router = Router();

// keis: liste favoris
router.get("/", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const favorites = await getFavorites(user.id);
    res.json({ favorites });
  } catch (error) {
    res.status(500).json({ error: "Unable to fetch favorites" });
  }
});

router.post("/", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const flight = req.body.flight;
  if (!flight) {
    return res.status(400).json({ error: "Missing flight" });
  }
  try {
    // tristan: add/toggle fav
    const favorites = await toggleFavorite(user.id, flight);
    res.json({ favorites });
  } catch (error) {
    res.status(500).json({ error: "Unable to update favorites" });
  }
});

router.put("/:id", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  // tristan: set statut
  try {
    const favorites = await setFavoriteStatus(user.id, req.params.id, req.body?.is_active);
    res.json({ favorites });
  } catch (error) {
    res.status(400).json({ error: error.message || "Unable to update favorite" });
  }
});

router.post("/manual", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const code = req.body?.code;
  // keis: ajoute manual code
  try {
    const favorites = await addFavoriteByCode(user.id, code);
    res.json({ favorites });
  } catch (error) {
    res.status(400).json({ error: error.message || "Unable to add favorite" });
  }
});

router.delete("/:id", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  // keis: suppr fav
  try {
    const favorites = await removeFavorite(user.id, req.params.id);
    res.json({ favorites });
  } catch (error) {
    res.status(400).json({ error: error.message || "Unable to delete favorite" });
  }
});

export default router;
