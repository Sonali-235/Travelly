"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminHeader } from "@/components/AdminHeader";
import { StatusBadge } from "@/components/StatusBadge";
import type { StoredOrder } from "@/lib/orders-db";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetch("/api/admin/orders", { cache: "no-store" })
      .then((res) => res.json())
      .then(setOrders)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  useEffect(() => {
    window.addEventListener("focus", load);
    return () => window.removeEventListener("focus", load);
  }, []);

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
        {orders.map((o) => (
          <Link
            key={o.id}
            href={`/admin/orders/${o.id}`}
            className="block rounded-xl2 border border-line bg-surface p-4 shadow-soft transition hover:border-brand/40"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-ink">
                  {o.customer.name} · {o.customer.phone}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {o.destinationId} · {o.plan === "plus" ? "Travelly Plus" : "Explorer"} ·{" "}
                  {new Date(o.createdAt).toLocaleString("en-IN")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {o.status === "delivered" && o.satisfactionRating && (
                  <span className="text-xs text-yellow-600">
                    {"★".repeat(o.satisfactionRating)}
                    {"☆".repeat(5 - o.satisfactionRating)}
                  </span>
                )}
                <StatusBadge status={o.status} />
                <span className="text-xs font-medium text-brand">Review & edit →</span>
              </div>
            </div>
          </Link>
        ))}
        {!loading && orders.length === 0 && (
          <p className="text-sm text-muted">No orders yet.</p>
        )}
      </div>
    </AdminHeader>
  );
}
