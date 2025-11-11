// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import { parseJson } from "./_parseJson.js";
import { getUserFromToken } from "./_authService.js";
import {
  getFavorites,
  toggleFavorite,
  setFavoriteStatus,
  addFavoriteByCode,
  removeFavorite
} from "./_favoritesService.js";

export default async function handler(req, res) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const user = await getUserFromToken(token);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (req.method === "GET") {
    const favorites = await getFavorites(user.id);
    res.status(200).json({ favorites });
    return;
  }

  if (req.method === "POST") {
    const body = await parseJson(req);
    if (body.code) {
      const favorites = await addFavoriteByCode(user.id, body.code);
      res.status(200).json({ favorites });
      return;
    }
    const favorites = await toggleFavorite(user.id, body.flight);
    res.status(200).json({ favorites });
    return;
  }

  if (req.method === "PUT") {
    const body = await parseJson(req);
    const favoriteId = req.query?.id || body.id;
    const favorites = await setFavoriteStatus(user.id, favoriteId, body?.is_active);
    res.status(200).json({ favorites });
    return;
  }

  if (req.method === "DELETE") {
    const favoriteId = req.query?.id;
    const favorites = await removeFavorite(user.id, favoriteId);
    res.status(200).json({ favorites });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
