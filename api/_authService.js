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

export async function registerUser({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !password) throw new Error("Email et mot de passe requis.");
  const { salt, hash } = hashPassword(password);
  const { data: inserted, error } = await supabase
    .from("users")
    .insert({ email: normalizedEmail, password_hash: hash, password_salt: salt })
    .select("*")
    .single();
  if (error || !inserted) throw new Error("Inscription impossible.");
  const token = generateToken();
  await supabase.from("sessions").insert({ token, user_id: inserted.id });
  return { user: inserted, token };
}

export async function loginUser({ identifier, password }) {
  const normalizedEmail = normalizeEmail(identifier);
  if (!normalizedEmail) throw new Error("Identifiants incorrects.");
  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", normalizedEmail)
    .single();
  if (error || !user) throw new Error("Identifiants incorrects.");
  const ok = comparePassword(password, user.password_salt, user.password_hash);
  if (!ok) throw new Error("Identifiants incorrects.");
  const token = generateToken();
  await supabase.from("sessions").insert({ token, user_id: user.id });
  return { user, token };
}
