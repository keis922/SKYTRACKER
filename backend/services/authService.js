// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import { randomBytes } from "crypto";
import { supabase } from "../api/_supabase.js";
import { hashPassword, comparePassword, generateToken } from "../api/utils/auth.js";

function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, passwordSalt, password_hash, password_salt, ...rest } = user;
  return rest;
}

function normalizeEmail(value) {
  return (value || "").trim().toLowerCase();
}

function normalizeUsername(value) {
  return (value || "").trim().toLowerCase();
}

function generateUsernameCandidate(raw, fallbackSeed = "") {
  const trimmed = (raw || "").trim();
  const base = trimmed || fallbackSeed || `pilot-${randomBytes(3).toString("hex")}`;
  return base.slice(0, 32);
}

async function ensureUniqueUsername(desired, excludeUserId = null) {
  let candidate = generateUsernameCandidate(desired);
  const { data: exactMatch } = await supabase
    .from("users")
    .select("id")
    .eq("username", candidate)
    .maybeSingle();
  if (!exactMatch || (excludeUserId && exactMatch.id === excludeUserId)) {
    return candidate;
  }
  let suffix = 2;
  while (suffix < 9999) {
    const next = `${candidate}-${suffix}`;
    const { data: found } = await supabase
      .from("users")
      .select("id")
      .eq("username", next)
      .maybeSingle();
    if (!found || (excludeUserId && found.id === excludeUserId)) {
      return next;
    }
    suffix += 1;
  }
  return `${candidate}-${randomBytes(2).toString("hex")}`;
}

async function createSession(userId) {
  const token = generateToken();
  await supabase.from("sessions").insert({
    token,
    user_id: userId,
    created_at: new Date().toISOString()
  });
  return token;
}

export async function getUserFromRequest(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return null;
  }
  const { data, error } = await supabase
    .from("sessions")
    .select("token, user_id, users(*)")
    .eq("token", token)
    .maybeSingle();
  if (error || !data) {
    return null;
  }
  const user = data.users || null;
  return sanitizeUser(user);
}

export async function registerUser(email, password, fullName = "", username = "") {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !password) {
    throw new Error("Email et mot de passe requis.");
  }
  const { data: existingEmail } = await supabase
    .from("users")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();
  if (existingEmail) {
    throw new Error("Un compte existe déjà avec cet email.");
  }
  const requestedUsername = (username || "").trim();
  const baseUsername =
    requestedUsername || normalizedEmail.split("@")[0] || `pilot-${randomBytes(2).toString("hex")}`;
  const finalUsername = await ensureUniqueUsername(baseUsername);
  const { salt, hash } = hashPassword(password);
  const { data: inserted, error } = await supabase
    .from("users")
    .insert({
      email: normalizedEmail,
      fullName: (fullName || "").trim(),
      username: finalUsername,
      password_hash: hash,
      password_salt: salt,
      created_at: new Date().toISOString()
    })
    .select("*")
    .single();
  if (error || !inserted) {
    throw new Error("Inscription impossible.");
  }
  const token = await createSession(inserted.id);
  return {
    user: sanitizeUser(inserted),
    token
  };
}

export async function loginUser(identifier, password) {
  if (!password) {
    throw new Error("Identifiants incorrects.");
  }
  let lookupEmail = "";
  let lookupUsername = "";
  if (typeof identifier === "string") {
    const trimmed = identifier.trim();
    if (trimmed.includes("@")) {
      lookupEmail = trimmed;
    } else {
      lookupUsername = trimmed;
    }
  } else if (identifier && typeof identifier === "object") {
    lookupEmail = identifier.email || identifier.identifier || "";
    lookupUsername = identifier.username || identifier.identifier || "";
    if (lookupEmail && !lookupEmail.includes("@")) {
      lookupUsername = lookupEmail;
      lookupEmail = "";
    }
  }
  const normalizedEmail = normalizeEmail(lookupEmail);
  const normalizedUsername = normalizeUsername(lookupUsername);
  if (!normalizedEmail && !normalizedUsername) {
    throw new Error("Email ou pseudo requis.");
  }
  let query = supabase.from("users").select("*").limit(1);
  if (normalizedEmail) {
    query = query.eq("email", normalizedEmail);
  } else if (normalizedUsername) {
    query = query.eq("username", normalizedUsername);
  }
  const { data: user, error } = await query.single();
  if (error || !user) {
    throw new Error("Identifiants incorrects.");
  }
  const ok = comparePassword(password, user.password_salt, user.password_hash);
  if (!ok) {
    throw new Error("Identifiants incorrects.");
  }
  const token = await createSession(user.id);
  return {
    user: sanitizeUser(user),
    token
  };
}

export async function logoutUser(token) {
  if (!token) {
    return;
  }
  await supabase.from("sessions").delete().eq("token", token);
}

export async function updateUserProfile(
  userId,
  { fullName, email, password, username } = {}
) {
  if (!userId) {
    throw new Error("Utilisateur introuvable.");
  }
  const updates = {};
  if (typeof email === "string") {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      throw new Error("Email requis.");
    }
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .neq("id", userId)
      .maybeSingle();
    if (existing) {
      throw new Error("Email déjà utilisé.");
    }
    updates.email = normalizedEmail;
  }
  if (typeof fullName === "string") {
    updates.fullName = fullName.trim();
  }
  if (typeof username === "string") {
    const trimmed = username.trim();
    if (!trimmed) {
      throw new Error("Pseudo requis.");
    }
    const finalUsername = await ensureUniqueUsername(trimmed, userId);
    updates.username = finalUsername;
  }
  if (password) {
    const { salt, hash } = hashPassword(password);
    updates.password_salt = salt;
    updates.password_hash = hash;
  }
  const { data: user, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", userId)
    .select("*")
    .single();
  if (error || !user) {
    throw new Error(error?.message || "Mise à jour impossible.");
  }
  return sanitizeUser(user);
}

export async function deleteUserAccount(userId) {
  if (!userId) {
    return;
  }
  await supabase.from("favorites").delete().eq("user_id", userId);
  await supabase.from("sessions").delete().eq("user_id", userId);
  await supabase.from("users").delete().eq("id", userId);
}
