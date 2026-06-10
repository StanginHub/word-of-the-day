import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client — SERVER-SIDE ONLY.
 * Bypasses Row Level Security. Never export to client components.
 */
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
