"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export function Header() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
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
    <header className="border-b border-line bg-surface/80 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
        <Link href="/" className="font-display text-lg font-semibold tracking-tight text-ink">
          Travelly
        </Link>
        <div className="flex items-center gap-4 text-xs font-medium">
          <Link href="/trips" className="text-muted hover:text-brand">
            My trips
          </Link>
          {email ? (
            <>
              <span className="hidden text-muted sm:inline">{email}</span>
              <button onClick={handleLogout} className="text-muted hover:text-brand">
                Log out
              </button>
            </>
          ) : (
            <Link href="/login" className="text-muted hover:text-brand">
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
