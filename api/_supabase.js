// Développement : Keïs (structure initiale, intégration Supabase)
// Révision : Tristan (optimisations et refactorisation visuelle)
// 
// \u2022 Keïs : logique backend, API, intégration Supabase, structure du projet.
// \u2022 Tristan : front-end, interface graphique, optimisation du rendu, Tailwind, Three.js.
// 
// \u23bb

import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || "";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
export const supabase = createClient(url, key);
