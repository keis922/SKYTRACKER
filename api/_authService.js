// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// • Keïs : logique backend, API, intégration Supabase, structure du projet.
// • Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// ⸻

import { supabase } from "./_supabase.js";

export async function registerUser({ email, password }) {
  if (!email || !password) throw new Error("Email et mot de passe requis.");
  const { data, error } = await supabase.from("users").insert({ email }).select("*").single();
  if (error || !data) throw new Error("Inscription impossible.");
  return { user: data, token: "" };
}

export async function loginUser() {
  throw new Error("Non implémenté");
}
