// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import { randomUUID } from "crypto";
import { supabase } from "./_supabase.js";

export async function getFavorites(userId) {
  const { data, error } = await supabase
    .from("favorites")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map((entry) => ({
    ...entry,
    is_active: entry.is_active !== false
  }));
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
  const payload = {
    id: randomUUID(),
    user_id: userId,
    flight_id: flight.id,
    flight_number: flight.flightNumber || flight.callsign || "",
    airline: flight.airline || "",
    status: flight.status || "",
    departure_airport: flight.departureAirport || "",
    arrival_airport: flight.arrivalAirport || "",
    latitude: flight.latitude ?? null,
    longitude: flight.longitude ?? null,
    is_active: true,
    created_at: new Date().toISOString()
  };
  const { error } = await supabase.from("favorites").insert(payload);
  if (error) throw new Error(error.message || "Unable to update favorites");
  return getFavorites(userId);
}

export async function setFavoriteStatus(userId, favoriteId, isActive) {
  const { error } = await supabase
    .from("favorites")
    .update({ is_active: Boolean(isActive) })
    .eq("id", favoriteId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message || "Favori introuvable");
  return getFavorites(userId);
}
