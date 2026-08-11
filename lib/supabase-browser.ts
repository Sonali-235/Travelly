"use client";

import { createBrowserClient } from "@supabase/ssr";

// Client-side only, for customer login/signup. Uses the public anon key —
// safe to expose, this is how Supabase Auth is designed to work. This is a
// completely separate system from lib/supabase.ts (which uses the secret
// service_role key for admin/order database access from the server).
export function getSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
