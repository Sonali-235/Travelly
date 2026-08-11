"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { StatusBadge } from "@/components/StatusBadge";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

interface TripSummary {
  id: string;
  destinationName: string;
  plan: string;
  status: string;
  createdAt: string;
}

export default function TripsPage() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      const isLoggedIn = !!data.user;
      setLoggedIn(isLoggedIn);
      if (!isLoggedIn) {
        setLoading(false);
        return;
      }
      fetch("/api/trips")
        .then((res) => res.json())
        .then(setTrips)
        .finally(() => setLoading(false));
    });
  }, []);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-xl px-5 pb-24">
        <h1 className="mt-8 font-display text-2xl font-semibold text-ink">My trips</h1>

        {loggedIn === false && (
          <div className="mt-6 rounded-xl2 border border-line bg-surface p-5 text-center shadow-soft">
            <p className="text-sm text-ink/80">Log in to see your trips.</p>
            <Link
              href="/login?redirect=/trips"
              className="mt-3 inline-block rounded-full bg-brand px-5 py-2 text-sm font-medium text-white hover:bg-brand-dark"
            >
              Log in
            </Link>
          </div>
        )}

        {loggedIn && loading && <p className="mt-6 text-sm text-muted">Loading…</p>}

        {loggedIn && !loading && (
          <div className="mt-6 space-y-3">
            {trips.length === 0 && (
              <p className="text-sm text-muted">
                No trips yet —{" "}
                <Link href="/plan" className="font-medium text-brand hover:underline">
                  plan your first one
                </Link>
                .
              </p>
            )}
            {trips.map((t) => (
              <Link
                key={t.id}
                href={`/itinerary?order=${t.id}`}
                className="block rounded-xl2 border border-line bg-surface p-4 shadow-soft transition hover:border-brand/40"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-ink">{t.destinationName}</p>
                  <StatusBadge status={t.status} />
                </div>
                <p className="mt-1 text-xs text-muted">
                  {t.plan === "plus" ? "Travelly Plus" : "Explorer"} ·{" "}
                  {new Date(t.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
