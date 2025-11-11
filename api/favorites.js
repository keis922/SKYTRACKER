import { parseJson } from "./_parseJson.js";
import { getUserFromToken } from "./_authService.js";
import {
  getFavorites,
  toggleFavorite,
  setFavoriteStatus,
  addFavoriteByCode,
  removeFavorite
} from "./_favoritesService.js";

// keis: route CRUD favoris
export default async function handler(req, res) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const user = await getUserFromToken(token);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (req.method === "GET") {
    try {
      const favorites = await getFavorites(user.id);
      res.status(200).json({ favorites });
    } catch (error) {
      res.status(500).json({ error: error.message || "Unable to fetch favorites" });
    }
    return;
  }

  if (req.method === "POST") {
    const body = await parseJson(req);
    const flight = body.flight;
    if (!flight) {
      res.status(400).json({ error: "Missing flight" });
      return;
    }
    try {
      const favorites = await toggleFavorite(user.id, flight);
      res.status(200).json({ favorites });
    } catch (error) {
      res.status(500).json({ error: error.message || "Unable to update favorites" });
    }
    return;
  }

  if (req.method === "PUT") {
    const body = await parseJson(req);
    const favoriteId = req.query?.id || body.id;
    try {
      const favorites = await setFavoriteStatus(user.id, favoriteId, body?.is_active);
      res.status(200).json({ favorites });
    } catch (error) {
      res.status(400).json({ error: error.message || "Unable to update favorite" });
    }
    return;
  }

  if (req.method === "DELETE") {
    const favoriteId = req.query?.id;
    try {
      const favorites = await removeFavorite(user.id, favoriteId);
      res.status(200).json({ favorites });
    } catch (error) {
      res.status(400).json({ error: error.message || "Unable to delete favorite" });
    }
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
