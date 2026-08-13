import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, verifySessionToken } from "@/lib/admin-auth";

export async function middleware(request: NextRequest) {
  // IMPORTANT: this response object must be the SAME one reused throughout —
  // recreating it inside the cookie callbacks (an earlier bug here) silently
  // drops any cookie set before the last one, corrupting the login session.
  let response = NextResponse.next({ request: { headers: request.headers } });

  // --- Part 1: keep the customer's Supabase auth session fresh. ---
  // This is a completely separate system from the admin password below —
  // this is real per-user login (email/password + Google). Uses the modern
  // batch getAll/setAll cookie API, which is the pattern @supabase/ssr
  // actually expects in middleware (the per-cookie get/set/remove style
  // used elsewhere in this app is fine in Route Handlers, but not safe here).
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );
  await supabase.auth.getUser();

  // --- Part 2: admin panel protection (single shared password, unrelated
  // to the customer auth above). ---
  const path = request.nextUrl.pathname;
  const isAdminArea = path.startsWith("/admin") || path.startsWith("/api/admin");
  const isLoginPage = path === "/admin/login";
  const isLoginApi = path === "/api/admin/login";

  if (isAdminArea && !isLoginPage && !isLoginApi) {
    const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const valid = await verifySessionToken(token);
    if (!valid) {
      if (path.startsWith("/api/")) {
        return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/checkout",
    "/trips",
    "/login",
    "/auth/callback",
    "/api/orders/:path*",
    "/api/trips",
  ],
};
