// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import { supabase } from "../api/_supabase.js";
import { hashPassword, comparePassword, generateToken } from "../api/utils/auth.js";

function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, password_salt, passwordHash, passwordSalt, ...rest } = user;
  return rest;
}

export async function registerUser(email, password) {
  if (!email || !password) throw new Error("Email et mot de passe requis.");
  const { salt, hash } = hashPassword(password);
  const { data: inserted, error } = await supabase
    .from("users")
    .insert({ email, password_hash: hash, password_salt: salt })
    .select("*")
    .single();
  if (error || !inserted) throw new Error("Inscription impossible.");
  const token = generateToken();
  await supabase.from("sessions").insert({ token, user_id: inserted.id });
  return { user: sanitizeUser(inserted), token };
}

export async function loginUser(identifier, password) {
  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", identifier)
    .single();
  if (error || !user) throw new Error("Identifiants incorrects.");
  const ok = comparePassword(password, user.password_salt, user.password_hash);
  if (!ok) throw new Error("Identifiants incorrects.");
  const token = generateToken();
  await supabase.from("sessions").insert({ token, user_id: user.id });
  return { user: sanitizeUser(user), token };
}

export async function logoutUser(token) {
  if (!token) return;
  await supabase.from("sessions").delete().eq("token", token);
}

export async function getUserFromRequest(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  const { data } = await supabase
    .from("sessions")
    .select("token, user_id, users(*)")
    .eq("token", token)
    .maybeSingle();
  return sanitizeUser(data?.users || null);
}

export async function updateUserProfile() {
  throw new Error("Non implémenté");
}

export async function deleteUserAccount() {
  return;
}
