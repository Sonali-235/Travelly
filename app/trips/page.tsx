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
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function loadTrips() {
    fetch("/api/trips", { cache: "no-store" })
      .then((res) => res.json())
      .then(setTrips)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      const isLoggedIn = !!data.user;
      setLoggedIn(isLoggedIn);
      if (!isLoggedIn) {
        setLoading(false);
        return;
      }
      loadTrips();
    });
  }, []);

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault(); // don't navigate into the trip
    e.stopPropagation();
    if (!confirm("Delete this trip? This can't be undone.")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setTrips((prev) => prev.filter((t) => t.id !== id));
    } catch {
      alert("Could not delete this trip. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-xl px-5 pb-24">
        <h1 className="mt-8 font-display text-2xl font-semibold text-ink">My trips</h1>
        <p className="mt-1 text-sm text-muted">Every trip you've paid for, in one place.</p>

        {loggedIn === null && <p className="mt-6 text-sm text-muted">Checking your login…</p>}

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
                  <div className="flex items-center gap-2">
                    <StatusBadge status={t.status} />
                    <button
                      onClick={(e) => handleDelete(t.id, e)}
                      disabled={deletingId === t.id}
                      title="Delete this trip"
                      className="rounded-full p-1 text-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path
                          d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6h16z"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
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
