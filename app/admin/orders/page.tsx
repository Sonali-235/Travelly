"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminHeader } from "@/components/AdminHeader";
import { StatusBadge } from "@/components/StatusBadge";
import type { StoredOrder } from "@/lib/orders-db";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<Record<string, string>>({});

  function load() {
    setLoading(true);
    fetch("/api/admin/orders", { cache: "no-store" })
      .then((res) => res.json())
      .then(setOrders)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleGenerate(id: string) {
    setBusyId(id);
    setActionError((e) => ({ ...e, [id]: "" }));
    try {
      const res = await fetch(`/api/admin/orders/${id}/generate`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Could not generate itinerary.");
      }
      load();
    } catch (err) {
      setActionError((e) => ({
        ...e,
        [id]: err instanceof Error ? err.message : "Something went wrong.",
      }));
    } finally {
      setBusyId(null);
    }
  }

  async function handleApprove(id: string) {
    setBusyId(id);
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: "ready" } : o)));
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ready" }),
    });
    setBusyId(null);
  }

  return (
    <AdminHeader>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Orders</h1>
          <p className="mt-1 text-sm text-muted">{orders.length} total, most recent first.</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="rounded-full border border-line px-4 py-2 text-xs font-medium text-ink hover:border-brand/40 disabled:opacity-60"
        >
          {loading ? "Refreshing…" : "↻ Refresh"}
        </button>
      </div>

      {loading && <p className="mt-6 text-sm text-muted">Loading…</p>}

      <div className="mt-6 space-y-3">
        {orders.map((o) => {
          const needsGeneration = !o.itinerary && o.status !== "pending_review";
          const needsApproval = o.status === "pending_review";

          return (
            <div key={o.id} className="rounded-xl2 border border-line bg-surface p-4 shadow-soft">
              <Link
                href={`/admin/orders/${o.id}`}
                className="flex items-center justify-between hover:opacity-80"
              >
                <div>
                  <p className="font-medium text-ink">
                    {o.customer.name} · {o.customer.phone}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {o.destinationId} · {o.plan === "plus" ? "Travelly Plus" : "Explorer"} ·{" "}
                    {new Date(o.createdAt).toLocaleString("en-IN")}
                  </p>
                </div>
                <StatusBadge status={o.status} />
              </Link>

              <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-line pt-3">
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="text-xs font-medium text-brand hover:underline"
                >
                  Review & edit →
                </Link>
                {needsGeneration && (
                  <button
                    onClick={() => handleGenerate(o.id)}
                    disabled={busyId === o.id}
                    className="rounded-full bg-brand px-4 py-1.5 text-xs font-medium text-white hover:bg-brand-dark disabled:opacity-60"
                  >
                    {busyId === o.id ? "Generating…" : "Generate itinerary"}
                  </button>
                )}
                {needsApproval && (
                  <button
                    onClick={() => handleApprove(o.id)}
                    disabled={busyId === o.id}
                    className="rounded-full bg-verified px-4 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-60"
                  >
                    {busyId === o.id ? "Publishing…" : "Approve & publish (as-is)"}
                  </button>
                )}
              </div>
              {actionError[o.id] && (
                <p className="mt-2 text-xs text-red-600">{actionError[o.id]}</p>
              )}
            </div>
          );
        })}
        {!loading && orders.length === 0 && (
          <p className="text-sm text-muted">No orders yet.</p>
        )}
      </div>
    </AdminHeader>
  );
}
