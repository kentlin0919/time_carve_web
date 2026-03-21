import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Database } from '@/types/database.types'

function getSupabaseStorageKey(supabaseUrl: string) {
  const hostname = new URL(supabaseUrl).hostname
  return `sb-${hostname.split('.')[0]}-auth-token`
}

function clearSupabaseAuthCookies(request: NextRequest, response: NextResponse, storageKey: string) {
  const cookieNames = request.cookies
    .getAll()
    .map(({ name }) => name)
    .filter((name) => name === storageKey || name.startsWith(`${storageKey}.`) || name.startsWith(`${storageKey}-`))

  cookieNames.forEach((name) => {
    request.cookies.delete(name)
    response.cookies.set({
      name,
      value: '',
      maxAge: 0,
      path: '/',
    })
  })
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const storageKey = supabaseUrl ? getSupabaseStorageKey(supabaseUrl) : ''
  // Fallback to ANON_KEY or PUBLISHABLE_KEY. 
  // Note: For server-side middleware, we can also use SERVICE_ROLE_KEY if needed, 
  // but for auth session management, ANON_KEY is correct.
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

  if (!supabaseUrl || !supabaseKey) {
     // If env vars are missing during build time or misconfiguration, 
     // we just return original response to avoid crash, but auth won't work.
     return response;
  }

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({
              name,
              value,
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value,
              ...options,
            })
          })
        },
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()
  const isInvalidRefreshToken = error?.code === 'refresh_token_not_found'

  if (isInvalidRefreshToken && storageKey) {
    clearSupabaseAuthCookies(request, response, storageKey)
  }

  // Protect routes logic
  const path = request.nextUrl.pathname;
  
  // Protected Routes Prefixes
  const isProtectedRoute = 
    path.startsWith('/student') || 
    path.startsWith('/teacher') || 
    path.startsWith('/admin');

  if (isProtectedRoute && !user) {
     // Redirect to login
     const url = request.nextUrl.clone()
     url.pathname = '/auth/login'
     url.searchParams.set('redirect', path); // keep the original path
     const redirectResponse = NextResponse.redirect(url)

     if (isInvalidRefreshToken && storageKey) {
       clearSupabaseAuthCookies(request, redirectResponse, storageKey)
     }

     return redirectResponse
  }

  // Optional: Redirect logged in users away from login page?
  // if (isAuthRoute && user) {
  //    // Determine dashboard based on role? Or just default.
  //    // This requires fetching user_info which might be expensive here. 
  //    // Let's keep it simple for now.
  // }

  return response
}
