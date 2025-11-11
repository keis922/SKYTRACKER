// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import { supabase } from "./_supabase.js";
import { hashPassword, comparePassword, generateToken } from "./utils/auth.js";

function normalizeEmail(value) {
  return (value || "").trim().toLowerCase();
}

function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, password_salt, passwordHash, passwordSalt, ...rest } = user;
  return rest;
}

export async function createSession(userId) {
  const token = generateToken();
  await supabase.from("sessions").insert({ token, user_id: userId, created_at: new Date().toISOString() });
  return token;
}

export async function getUserFromToken(token) {
  if (!token) return null;
  const { data } = await supabase
    .from("sessions")
    .select("token, user_id, users(*)")
    .eq("token", token)
    .maybeSingle();
  return sanitizeUser(data?.users || { id: data?.user_id });
}

export async function registerUser({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !password) throw new Error("Email et mot de passe requis.");
  const { data: existingEmail } = await supabase
    .from("users")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();
  if (existingEmail) throw new Error("Un compte existe déjà avec cet email.");
  const { salt, hash } = hashPassword(password);
  const { data: inserted, error } = await supabase
    .from("users")
    .insert({ email: normalizedEmail, password_hash: hash, password_salt: salt })
    .select("*")
    .single();
  if (error || !inserted) throw new Error("Inscription impossible.");
  const token = await createSession(inserted.id);
  return { user: sanitizeUser(inserted), token };
}

export async function loginUser({ identifier, password }) {
  if (!password) throw new Error("Identifiants incorrects.");
  const normalizedEmail = normalizeEmail(identifier);
  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", normalizedEmail)
    .single();
  if (error || !user) throw new Error("Identifiants incorrects.");
  const ok = comparePassword(password, user.password_salt, user.password_hash);
  if (!ok) throw new Error("Identifiants incorrects.");
  const token = await createSession(user.id);
  return { user: sanitizeUser(user), token };
}

export async function logoutUser(token) {
  if (!token) return;
  await supabase.from("sessions").delete().eq("token", token);
}
