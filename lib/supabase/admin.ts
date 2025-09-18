import { createClient as createSupabaseServer } from '@supabase/supabase-js'

// Create an admin client using the service role key. NEVER expose this on the client.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createSupabaseServer(url, serviceKey, { auth: { persistSession: false } })
}

