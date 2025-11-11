// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import { getUserFromToken, updateProfile, deleteAccount } from "../_authService.js";
import { parseJson } from "../_parseJson.js";

export default async function handler(req, res) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const user = await getUserFromToken(token);
  if (!user) {
    res.status(401).json({ error: "Non authentifié." });
    return;
  }

  if (req.method === "GET") {
    res.status(200).json({ user });
    return;
  }

  if (req.method === "PUT") {
    const body = await parseJson(req);
    try {
      const updated = await updateProfile(user.id, {
        fullName: body.fullName,
        email: body.email,
        password: body.password,
        username: body.username
      });
      res.status(200).json({ user: updated });
    } catch (error) {
      res.status(400).json({ error: error.message || "Mise à jour impossible." });
    }
    return;
  }

  if (req.method === "DELETE") {
    await deleteAccount(user.id);
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
