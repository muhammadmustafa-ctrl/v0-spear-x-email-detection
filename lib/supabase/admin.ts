import "server-only"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

let supabaseAdminSingleton: ReturnType<
  typeof createServerClient<typeof import("@supabase/supabase-js").SupabaseClient>
> | null = null

export function getSupabaseAdminClient() {
  if (supabaseAdminSingleton) return supabaseAdminSingleton as any
  const cookieStore = cookies()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY // server-only
  if (!url || !key) {
    throw new Error("Supabase admin client missing env vars")
  }

  supabaseAdminSingleton = createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set() {},
      remove() {},
    },
  }) as any

  return supabaseAdminSingleton as any
}
