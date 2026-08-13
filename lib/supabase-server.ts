import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server-side, cookie-aware Supabase client — this is how we know WHO is
// logged in during a request (Server Component, Route Handler, etc). Uses
// the public anon key + the user's own session cookie, so it only ever sees
// what that user is allowed to see (their own auth identity). This is
// separate from lib/supabase.ts, which uses the secret service_role key for
// admin/order data access and has nothing to do with customer login.
//
// Uses the batch getAll/setAll cookie API (the current @supabase/ssr
// pattern) for consistency with middleware.ts, rather than the older
// per-cookie get/set/remove style.
export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component, which can't set cookies —
            // middleware refreshes the session instead. Safe to ignore.
          }
        },
      },
    }
  );
}

/** Convenience helper: returns the logged-in user, or null. */
export async function getCurrentUser() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
