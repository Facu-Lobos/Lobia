import "server-only";
import { createClient } from "@supabase/supabase-js";

// Sólo server-side: usa la service_role key, que bypassea RLS. Nunca
// importar este módulo desde un Client Component.
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export const PATIENT_DOCUMENTS_BUCKET = "patient-documents";
