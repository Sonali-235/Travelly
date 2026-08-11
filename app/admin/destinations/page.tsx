"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminHeader } from "@/components/AdminHeader";
import { Destination } from "@/lib/types";

export default function AdminDestinationsPage() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    fetch("/api/admin/destinations")
      .then((res) => res.json())
      .then(setDestinations)
      .catch(() => setError("Could not load destinations."))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleDelete(id: string) {
    if (!confirm(`Delete "${id}"? This can't be undone.`)) return;
    const res = await fetch(`/api/admin/destinations/${id}`, { method: "DELETE" });
    if (res.ok) {
      load();
    } else {
      alert("Could not delete destination.");
    }
  }

  return (
    <>
      <AdminHeader />
      <main className="mx-auto max-w-4xl px-5 py-10">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-semibold text-ink">Destinations</h1>
          <Link
            href="/admin/destinations/editor"
            className="rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark"
          >
            + Add destination
          </Link>
        </div>

        {loading && <p className="mt-6 text-sm text-muted">Loading…</p>}
        {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

        <div className="mt-6 space-y-3">
          {destinations.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between rounded-xl2 border border-line bg-surface p-4 shadow-soft"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-ink">
                    {d.accentEmoji} {d.name}, {d.state}
                  </p>
                  {d.verified.isSampleData && (
                    <span className="rounded-full border border-warn-border bg-warn-bg px-2 py-0.5 text-xs text-warn">
                      Placeholder data
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted">{d.tagline}</p>
              </div>
              <div className="flex gap-3">
                <Link
                  href={`/admin/destinations/editor?id=${d.id}`}
                  className="text-sm font-medium text-brand hover:underline"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(d.id)}
                  className="text-sm font-medium text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {!loading && destinations.length === 0 && (
            <p className="text-sm text-muted">No destinations yet — add your first one.</p>
          )}
        </div>
      </main>
    </>
  );
}
