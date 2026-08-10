import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, verifySessionToken } from "@/lib/admin-auth";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  // --- Part 1: keep the customer's Supabase auth session fresh. ---
  // This is a completely separate system from the admin password below —
  // this is real per-user login (email/password + Google).
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          request.cookies.set({ name, value });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: Record<string, unknown>) {
          request.cookies.set({ name, value: "" });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
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
    "/api/generate-itinerary",
    "/api/trips",
  ],
};
