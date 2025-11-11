// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import { supabase } from "./_supabase.js";

export async function getFavorites(userId) {
  if (!userId) return [];
  const { data } = await supabase.from("favorites").select("*").eq("user_id", userId);
  return data || [];
}

export async function toggleFavorite(userId, flight) {
  if (!userId || !flight?.id) return getFavorites(userId);
  await supabase.from("favorites").insert({ user_id: userId, flight_id: flight.id });
  return getFavorites(userId);
}
