"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AdminHeader } from "@/components/AdminHeader";
import { ItineraryEditor } from "@/components/admin/ItineraryEditor";
import { StatusBadge } from "@/components/StatusBadge";
import type { StoredOrder } from "@/lib/orders-db";
import { Destination, GeneratedItinerary, PLAN_PRICES } from "@/lib/types";

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<StoredOrder | null>(null);
  const [destination, setDestination] = useState<Destination | null>(null);
  const [itinerary, setItinerary] = useState<GeneratedItinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  function load() {
    setLoading(true);
    fetch(`/api/admin/orders/${orderId}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        setOrder(data.order);
        setDestination(data.destination);
        setItinerary(data.order?.itinerary ?? null);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, [orderId]);

  async function handleGenerate() {
    setBusy("generate");
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/generate`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Could not generate itinerary.");
      }
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  async function handleSaveEdits() {
    if (!itinerary) return;
    setBusy("save");
    setError("");
    setSavedMsg("");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/itinerary`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(itinerary),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Could not save changes.");
      }
      setSavedMsg("Saved.");
      setTimeout(() => setSavedMsg(""), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  async function handleApprove() {
    setBusy("approve");
    setError("");
    try {
      // Save any unsaved edits first, then publish — one click does both.
      if (itinerary) {
        const saveRes = await fetch(`/api/admin/orders/${orderId}/itinerary`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(itinerary),
        });
        if (!saveRes.ok) throw new Error("Could not save your edits.");
      }
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ready" }),
      });
      if (!res.ok) throw new Error("Could not publish.");
      router.push("/admin/orders");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <AdminHeader>
        <p className="text-sm text-muted">Loading…</p>
      </AdminHeader>
    );
  }

  if (!order || !destination) {
    return (
      <AdminHeader>
        <p className="text-sm text-red-600">Order not found.</p>
      </AdminHeader>
    );
  }

  const trip = order.tripRequest;
  const showVerifiedPreview = order.plan === "plus";
  const isDelivered = order.status === "delivered";
  const isRegenerating = order.status === "regenerating";
  const needsGeneration = !itinerary || isRegenerating;

  return (
    <AdminHeader>
      <Link href="/admin/orders" className="text-xs font-medium text-brand hover:underline">
        ← Back to orders
      </Link>

      <div className="mt-2 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">
            {order.customer.name} — {destination.name}, {destination.state}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {order.customer.phone} · {order.plan === "plus" ? "Travelly Plus" : "Explorer"} (₹
            {PLAN_PRICES[order.plan]}) · placed {new Date(order.createdAt).toLocaleString("en-IN")}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Regeneration request banner — the whole reason this order needs attention */}
      {isRegenerating && (
        <div className="mt-4 rounded-xl2 border border-warn-border bg-warn-bg p-4">
          <p className="text-sm font-medium text-warn">Customer requested a regeneration</p>
          {order.regenerationReason ? (
            <p className="mt-1 text-sm text-ink/80">"{order.regenerationReason}"</p>
          ) : (
            <p className="mt-1 text-sm text-ink/60">No specific reason given.</p>
          )}
        </div>
      )}

      {/* Delivered summary — final state, shown instead of the editor */}
      {isDelivered && (
        <div className="mt-4 rounded-xl2 border border-brand/30 bg-brand-light p-4">
          <p className="text-sm font-medium text-brand">
            Delivered — customer confirmed satisfaction
          </p>
          <p className="mt-1 text-sm text-ink/80">
            Rating: {"★".repeat(order.satisfactionRating || 0)}
            {"☆".repeat(5 - (order.satisfactionRating || 0))} ({order.satisfactionRating}/5)
          </p>
          {order.satisfactionComment && (
            <p className="mt-1 text-sm text-ink/70">"{order.satisfactionComment}"</p>
          )}
        </div>
      )}

      {/* Trip request — read-only, formatted, no JSON */}
      <section className="mt-6 rounded-xl2 border border-line bg-surface p-4 shadow-soft">
        <h2 className="text-sm font-semibold text-ink">What the customer asked for</h2>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
          <Field label="Departure city" value={trip.departureCity} />
          <Field label="Days" value={String(trip.days)} />
          <Field label="Start date" value={trip.startDate} />
          <Field label="Travelers" value={`${trip.adults} adults, ${trip.children} children, ${trip.infants} infants`} />
          <Field label="Budget style" value={trip.budgetStyle} />
          <Field label="Pace" value={trip.pace} />
          <Field label="Travel mode" value={trip.travelMode} />
          <Field label="Must-visit" value={trip.mustVisit || "—"} />
          <Field label="Avoid" value={trip.placesToAvoid || "—"} />
        </dl>
        {trip.additionalPreferences && (
          <div className="mt-2">
            <p className="text-xs font-medium text-muted">Additional preferences</p>
            <p className="mt-0.5 text-sm text-ink/80">{trip.additionalPreferences}</p>
          </div>
        )}
      </section>

      {/* Verified data preview — what the customer will ALSO see, for Plus orders */}
      {showVerifiedPreview && (
        <section className="mt-4 rounded-xl2 border border-verified-border bg-verified-bg p-4">
          <h2 className="text-sm font-semibold text-verified">
            Verified info this customer will also see (Plus plan)
          </h2>
          <p className="mt-1 text-xs text-ink/70">
            This comes from the destination record, not this order — edit it from{" "}
            <Link href="/admin/destinations" className="underline">
              Destinations
            </Link>{" "}
            if it needs fixing.
          </p>
          <div className="mt-2 text-xs text-ink/80">
            {destination.verified.hotels.length} hotels · {destination.verified.attractions.length}{" "}
            attractions · {destination.verified.emergencyContacts.length} emergency contacts
            {destination.verified.isSampleData && (
              <span className="ml-2 font-medium text-warn">⚠ still placeholder data</span>
            )}
          </div>
        </section>
      )}

      {/* Itinerary review/edit — locked once delivered */}
      {!isDelivered && (
        <section className="mt-6 rounded-xl2 border border-line bg-surface p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">AI-generated itinerary</h2>
            {needsGeneration && (
              <button
                onClick={handleGenerate}
                disabled={busy !== null}
                className="rounded-full bg-brand px-4 py-1.5 text-xs font-medium text-white hover:bg-brand-dark disabled:opacity-60"
              >
                {busy === "generate"
                  ? "Generating…"
                  : isRegenerating
                  ? "Process regeneration request"
                  : "Generate itinerary"}
              </button>
            )}
          </div>

          {!itinerary && (
            <p className="mt-3 text-sm text-muted">No draft yet — click "Generate itinerary" above.</p>
          )}

          {itinerary && !isRegenerating && (
            <div className="mt-4">
              <ItineraryEditor itinerary={itinerary} onChange={setItinerary} />
            </div>
          )}

          {itinerary && isRegenerating && (
            <p className="mt-3 text-sm text-muted">
              Showing the previous draft below — click "Process regeneration request" above to
              generate a new one addressing the customer's feedback.
            </p>
          )}
          {itinerary && isRegenerating && (
            <div className="mt-4 opacity-50">
              <ItineraryEditor itinerary={itinerary} onChange={() => {}} />
            </div>
          )}
        </section>
      )}

      {isDelivered && (
        <section className="mt-6 rounded-xl2 border border-line bg-surface p-4 shadow-soft opacity-75">
          <h2 className="text-sm font-semibold text-ink">Final itinerary (read-only)</h2>
          <p className="mt-1 text-xs text-muted">
            This order is delivered — no further edits are possible.
          </p>
          {itinerary && (
            <div className="pointer-events-none mt-4">
              <ItineraryEditor itinerary={itinerary} onChange={() => {}} />
            </div>
          )}
        </section>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {savedMsg && <p className="mt-4 text-sm text-verified">{savedMsg}</p>}

      {!isDelivered && !isRegenerating && itinerary && (
        <div className="mt-6 flex flex-wrap gap-3 pb-16">
          <button
            onClick={handleSaveEdits}
            disabled={busy !== null}
            className="rounded-full border border-brand px-5 py-2.5 text-sm font-medium text-brand hover:bg-brand-light disabled:opacity-60"
          >
            {busy === "save" ? "Saving…" : "Save"}
          </button>
          <button
            onClick={handleApprove}
            disabled={busy !== null}
            className="rounded-full bg-verified px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {busy === "approve" ? "Publishing…" : "Publish and approve"}
          </button>
        </div>
      )}
    </AdminHeader>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-ink/90">{value}</dd>
    </div>
  );
}
