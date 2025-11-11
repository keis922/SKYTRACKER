import { randomUUID } from "crypto";
import { supabase } from "./_supabase.js";

// keis: liste favoris ordre recent
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

// keis: toggle fav on/off
export async function toggleFavorite(userId, flight) {
  if (!userId || !flight?.id) throw new Error("Flight data missing");
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
    status: flight.status || "Terminé",
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

// keis: set actif ou non
export async function setFavoriteStatus(userId, favoriteId, isActive) {
  if (!userId || !favoriteId) throw new Error("Informations manquantes");
  const { error } = await supabase
    .from("favorites")
    .update({ is_active: Boolean(isActive) })
    .eq("id", favoriteId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message || "Favori introuvable");
  return getFavorites(userId);
}

// keis: ajout manuel par code
export async function addFavoriteByCode(userId, code) {
  if (!userId || !code) throw new Error("Code requis");
  const normalized = code.trim().toUpperCase();
  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("flight_id", normalized)
    .maybeSingle();
  if (!existing) {
    const payload = {
      id: randomUUID(),
      user_id: userId,
      flight_id: normalized,
      flight_number: normalized,
      airline: "Vol personnalisé",
      status: "Suivi manuel",
      departure_airport: "-",
      arrival_airport: "-",
      latitude: null,
      longitude: null,
      is_active: true,
      created_at: new Date().toISOString()
    };
    await supabase.from("favorites").insert(payload);
  }
  return getFavorites(userId);
}

// keis: supprime un fav
export async function removeFavorite(userId, favoriteId) {
  if (!userId || !favoriteId) throw new Error("Informations manquantes");
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("id", favoriteId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message || "Favori introuvable");
  return getFavorites(userId);
}
