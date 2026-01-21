import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'

let clientPromise: ReturnType<typeof createBrowserClient<Database>> | undefined

export function createClient() {
  if (typeof window === 'undefined') {
    return createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''
    )
  }

  if (!clientPromise) {
    clientPromise = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''
    )
  }

  return clientPromise
}