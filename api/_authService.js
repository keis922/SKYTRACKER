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

function normalizeUsername(value) {
  return (value || "").trim().toLowerCase();
}

function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, password_salt, passwordHash, passwordSalt, ...rest } = user;
  return rest;
}

function usernameCandidate(raw, fallback = "") {
  const trimmed = (raw || "").trim();
  const base = trimmed || fallback || `pilot-${Math.random().toString(36).slice(2, 6)}`;
  return base.slice(0, 32);
}

async function ensureUniqueUsername(desired, excludeUserId = null) {
  let candidate = usernameCandidate(desired);
  const { data: exact } = await supabase
    .from("users")
    .select("id")
    .eq("username", candidate)
    .maybeSingle();
  if (!exact || (excludeUserId && exact.id === excludeUserId)) return candidate;
  let suffix = 2;
  while (suffix < 9999) {
    const next = `${candidate}-${suffix}`;
    const { data: found } = await supabase
      .from("users")
      .select("id")
      .eq("username", next)
      .maybeSingle();
    if (!found || (excludeUserId && found.id === excludeUserId)) return next;
    suffix += 1;
  }
  return `${candidate}-${Math.random().toString(36).slice(2, 4)}`;
}

export async function createSession(userId) {
  const token = generateToken();
  await supabase.from("sessions").insert({
    token,
    user_id: userId,
    created_at: new Date().toISOString()
  });
  return token;
}

export async function getUserFromToken(token) {
  if (!token) return null;
  const { data, error } = await supabase
    .from("sessions")
    .select("token, user_id, users(*)")
    .eq("token", token)
    .maybeSingle();
  if (error || !data) return null;
  return sanitizeUser(data.users || { id: data.user_id });
}

export async function registerUser({ email, password, fullName = "", username = "" }) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !password) throw new Error("Email et mot de passe requis.");

  const { data: existingEmail } = await supabase
    .from("users")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();
  if (existingEmail) throw new Error("Un compte existe déjà avec cet email.");

  const baseUsername =
    (username || "").trim() ||
    normalizedEmail.split("@")[0] ||
    `pilot-${Math.random().toString(36).slice(2, 6)}`;
  const finalUsername = await ensureUniqueUsername(baseUsername);

  const { salt, hash } = hashPassword(password);
  const { data: inserted, error } = await supabase
    .from("users")
    .insert({
      email: normalizedEmail,
      username: finalUsername,
      fullName: fullName || "",
      password_hash: hash,
      password_salt: salt,
      created_at: new Date().toISOString()
    })
    .select("*")
    .single();
  if (error || !inserted) throw new Error("Inscription impossible.");

  const token = await createSession(inserted.id);
  return { user: sanitizeUser(inserted), token };
}

export async function loginUser({ identifier, password }) {
  if (!password) throw new Error("Identifiants incorrects.");
  const raw = (identifier || "").trim();
  const byEmail = raw.includes("@");
  const normalizedEmail = byEmail ? normalizeEmail(raw) : "";
  const normalizedUsername = byEmail ? "" : normalizeUsername(raw);

  let query = supabase.from("users").select("*").limit(1);
  if (normalizedEmail) query = query.eq("email", normalizedEmail);
  else if (normalizedUsername) query = query.eq("username", normalizedUsername);
  const { data: user, error } = await query.single();
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

export async function updateProfile(userId, { fullName, email, password, username }) {
  const updates = {};
  if (typeof email === "string") {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) throw new Error("Email requis.");
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .neq("id", userId)
      .maybeSingle();
    if (existing) throw new Error("Email déjà utilisé.");
    updates.email = normalizedEmail;
  }
  if (typeof fullName === "string") updates.fullName = fullName.trim();
  if (typeof username === "string") {
    const trimmed = username.trim();
    if (!trimmed) throw new Error("Pseudo requis.");
    updates.username = await ensureUniqueUsername(trimmed, userId);
  }
  if (password) {
    const { salt, hash } = hashPassword(password);
    updates.password_salt = salt;
    updates.password_hash = hash;
  }
  if (Object.keys(updates).length === 0) {
    const { data: user } = await supabase.from("users").select("*").eq("id", userId).single();
    return sanitizeUser(user);
  }
  const { data: user, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", userId)
    .select("*")
    .single();
  if (error || !user) throw new Error(error?.message || "Mise à jour impossible.");
  return sanitizeUser(user);
}

export async function deleteAccount(userId) {
  if (!userId) return;
  await supabase.from("favorites").delete().eq("user_id", userId);
  await supabase.from("sessions").delete().eq("user_id", userId);
  await supabase.from("users").delete().eq("id", userId);
}
