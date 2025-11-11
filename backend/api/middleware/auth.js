// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import { supabase } from "../_supabase.js";

export async function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Missing token" });
  }

  const { data, error } = await supabase
    .from("sessions")
    .select("token, user_id, users(*)")
    .eq("token", token)
    .single();

  if (error || !data) {
    return res.status(401).json({ error: "Invalid token" });
  }

  req.user = data.users || { id: data.user_id };
  next();
}
