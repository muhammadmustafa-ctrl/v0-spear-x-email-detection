import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

let _serverSupabase: ReturnType<typeof createServerClient> | null = null

export function getServerSupabase() {
  if (_serverSupabase) return _serverSupabase
  _serverSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies },
  )
  return _serverSupabase
}
