"use client";

import { useEffect, useState } from "react";
import { AdminHeader } from "@/components/AdminHeader";
import { StatusBadge } from "@/components/StatusBadge";
import type { StoredOrder } from "@/lib/orders-db";

const STATUS_OPTIONS = [
  "awaiting_payment",
  "payment_successful",
  "ai_processing",
  "pending_review",
  "ready",
  "delivered",
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
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

  async function updateStatus(id: string, status: string) {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: status as StoredOrder["status"] } : o)));
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

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
    await updateStatus(id, "ready");
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
            <div key={o.id} className="rounded-xl2 border border-line bg-surface shadow-soft">
              <button
                onClick={() => setExpandedId(expandedId === o.id ? null : o.id)}
                className="flex w-full items-center justify-between p-4 text-left"
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
              </button>

              {/* Quick actions visible without expanding — this is the main workflow */}
              <div className="flex flex-wrap gap-2 px-4 pb-4">
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
                    {busyId === o.id ? "Publishing…" : "Approve & publish to customer"}
                  </button>
                )}
                {actionError[o.id] && (
                  <p className="w-full text-xs text-red-600">{actionError[o.id]}</p>
                )}
              </div>

              {expandedId === o.id && (
                <div className="border-t border-line p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">
                    Trip request
                  </p>
                  <pre className="mt-1 overflow-x-auto rounded-lg bg-canvas p-3 text-xs text-ink/70">
                    {JSON.stringify(o.tripRequest, null, 2)}
                  </pre>

                  {o.itinerary && (
                    <>
                      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted">
                        Generated itinerary (preview)
                      </p>
                      <pre className="mt-1 max-h-64 overflow-y-auto overflow-x-auto rounded-lg bg-canvas p-3 text-xs text-ink/70">
                        {JSON.stringify(o.itinerary, null, 2)}
                      </pre>
                    </>
                  )}

                  <label className="mt-4 block max-w-xs">
                    <span className="mb-1 block text-xs font-medium text-ink">
                      Manually set status
                    </span>
                    <select
                      value={o.status}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                      className="w-full rounded-xl border border-line px-3 py-2 text-sm"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
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
