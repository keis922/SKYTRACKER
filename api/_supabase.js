import { createClient } from "@supabase/supabase-js";

// keis: client supabase sans session gardee
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);
