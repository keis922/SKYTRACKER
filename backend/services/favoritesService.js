// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import { randomUUID } from "crypto";
import { supabase } from "../api/_supabase.js";

export async function getFavorites(userId) {
  const { data } = await supabase
    .from("favorites")
    .select("*")
    .eq("user_id", userId);
  return data || [];
}

export async function toggleFavorite(userId, flight) {
  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("flight_id", flight.id)
    .maybeSingle();
  if (existing) {
    await supabase.from("favorites").delete().eq("id", existing.id);
    return getFavorites(userId);
  }
  await supabase.from("favorites").insert({
    id: randomUUID(),
    user_id: userId,
    flight_id: flight.id,
    flight_number: flight.flightNumber || ""
  });
  return getFavorites(userId);
}

export async function setFavoriteStatus(userId, favoriteId, isActive) {
  await supabase
    .from("favorites")
    .update({ is_active: Boolean(isActive) })
    .eq("id", favoriteId)
    .eq("user_id", userId);
  return getFavorites(userId);
}

export async function addFavoriteByCode(userId, code) {
  if (!userId || !code) return getFavorites(userId);
  const normalized = code.trim().toUpperCase();
  await supabase.from("favorites").insert({
    id: randomUUID(),
    user_id: userId,
    flight_id: normalized,
    flight_number: normalized,
    is_active: true
  });
  return getFavorites(userId);
}

export async function removeFavorite(userId, favoriteId) {
  await supabase
    .from("favorites")
    .delete()
    .eq("id", favoriteId)
    .eq("user_id", userId);
  return getFavorites(userId);
}
