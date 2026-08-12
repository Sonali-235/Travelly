"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

const NAV_ITEMS = [
  { href: "/plan", label: "Plan a trip", icon: CompassIcon },
  { href: "/trips", label: "My trips", icon: ListIcon },
];

export function Sidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-canvas md:flex">
      {/* Sidebar: left column on desktop, top bar on mobile */}
      <aside className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 md:fixed md:inset-y-0 md:left-0 md:w-56 md:flex-col md:items-stretch md:justify-start md:border-b-0 md:border-r md:px-4 md:py-6">
        <Link href="/" className="font-display text-lg font-semibold tracking-tight text-ink">
          Travelly
        </Link>

        <nav className="flex items-center gap-1 md:mt-8 md:flex-col md:items-stretch md:gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active ? "bg-brand-light text-brand" : "text-muted hover:bg-canvas hover:text-ink"
                }`}
              >
                <Icon />
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:mt-auto md:block md:pt-6">
          {email ? (
            <div className="border-t border-line pt-4">
              <p className="truncate text-xs text-muted">{email}</p>
              <button
                onClick={handleLogout}
                className="mt-2 text-xs font-medium text-muted hover:text-brand"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="block rounded-lg bg-brand px-3 py-2 text-center text-sm font-medium text-white hover:bg-brand-dark"
            >
              Log in
            </Link>
          )}
        </div>
      </aside>

      <main className="flex-1 md:ml-56">
        <div className="mx-auto max-w-3xl px-5 py-8">{children}</div>
      </main>
    </div>
  );
}

function CompassIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M15 9l-2 5-5 2 2-5 5-2z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
