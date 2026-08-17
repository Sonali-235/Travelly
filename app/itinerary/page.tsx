"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { ItineraryDisplay } from "@/components/ItineraryDisplay";
import { StatusBadge } from "@/components/StatusBadge";
import { Destination, GeneratedItinerary, PlanTier, REGENERATION_LIMITS } from "@/lib/types";

interface OrderResponse {
  id: string;
  status: string;
  plan: PlanTier;
  customerName: string;
  itinerary: GeneratedItinerary | null;
  regenerationsUsed: number;
  satisfactionRating: number | null;
  satisfactionComment: string | null;
  destination: Destination;
  createdAt: string;
}

const STATUS_MESSAGES: Record<string, string> = {
  under_review: "Our team is preparing (or double-checking) your itinerary before sending it over.",
  regenerating: "Got it — we're reworking your itinerary based on your feedback.",
};

export default function ItineraryPage() {
  return (
    <Suspense
      fallback={
        <>
          <Header />
          <main className="mx-auto max-w-2xl px-5 py-24 text-center text-sm text-muted">
            Loading…
          </main>
        </>
      }
    >
      <ItineraryContent />
    </Suspense>
  );
}

function ItineraryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");

  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [checking, setChecking] = useState(false);

  const load = useCallback(
    async (silent = false) => {
      if (!orderId) return;
      if (!silent) setStatus("loading");
      try {
        const res = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Could not load that trip.");
        }
        const data = await res.json();
        setOrder(data);
        setStatus("loaded");
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
        setStatus("error");
      }
    },
    [orderId]
  );

  useEffect(() => {
    if (!orderId) {
      router.replace("/plan");
      return;
    }
    load();
  }, [orderId, load, router]);

  async function handleCheckAgain() {
    setChecking(true);
    await load(true);
    setChecking(false);
  }

  function downloadAsText() {
    if (!order?.itinerary || !order.destination) return;
    const { itinerary, destination } = order;
    const lines: string[] = [];
    lines.push(`TRAVELLY — ${destination.name}, ${destination.state}`);
    lines.push(`Plan: ${order.plan === "plus" ? "Travelly Plus" : "Explorer"}`);
    lines.push("");
    lines.push(itinerary.tripOverview);
    lines.push("");
    itinerary.days.forEach((d) => {
      lines.push(`DAY ${d.day}: ${d.title}`);
      lines.push(`  Morning: ${d.morning}`);
      lines.push(`  Afternoon: ${d.afternoon}`);
      lines.push(`  Evening: ${d.evening}`);
      if (d.whyThisPlan) lines.push(`  Why this plan: ${d.whyThisPlan}`);
      lines.push("");
    });
    lines.push("ESTIMATED BUDGET");
    itinerary.estimatedBudget.forEach((b) => lines.push(`  ${b.category}: ${b.amount}`));
    lines.push("");
    lines.push("PACKING CHECKLIST");
    itinerary.packingChecklist.forEach((p) => lines.push(`  - ${p}`));
    lines.push("");
    lines.push("TRAVEL TIPS");
    itinerary.travelTips.forEach((t) => lines.push(`  - ${t}`));
    if (itinerary.photographySuggestions.length > 0) {
      lines.push("");
      lines.push("PHOTOGRAPHY SPOTS");
      itinerary.photographySuggestions.forEach((p) => lines.push(`  - ${p}`));
    }

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `travelly-${destination.id}-itinerary.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const showItinerary =
    status === "loaded" && order && (order.status === "ready" || order.status === "delivered") && order.itinerary;
  const showWaiting = status === "loaded" && order && !showItinerary;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-5 pb-24">
        {status === "loading" && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            <p className="mt-4 text-sm text-muted">Loading your trip…</p>
          </div>
        )}

        {status === "error" && (
          <div className="py-24 text-center">
            <p className="font-display text-lg font-semibold text-ink">
              We couldn't load this trip
            </p>
            <p className="mt-2 text-sm text-muted">{errorMsg}</p>
          </div>
        )}

        {showItinerary && order && order.itinerary && (
          <div className="py-8">
            <ItineraryDisplay
              destination={order.destination}
              itinerary={order.itinerary}
              plan={order.plan}
              travelerName={order.customerName}
            />
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <a
                href={`/api/orders/${order.id}/pdf`}
                className="flex-1 rounded-full bg-brand px-6 py-3 text-center text-sm font-medium text-white transition hover:bg-brand-dark"
              >
                Download as PDF
              </a>
              <button
                onClick={downloadAsText}
                className="flex-1 rounded-full border border-brand px-6 py-3 text-sm font-medium text-brand transition hover:bg-brand-light"
              >
                Download as text
              </button>
            </div>
            <EmailItinerary orderId={order.id} />

            {order.status === "delivered" ? (
              <div className="mx-auto mt-8 max-w-sm rounded-xl2 border border-brand/30 bg-brand-light p-4 text-center">
                <p className="text-sm font-medium text-brand">Thanks for your feedback!</p>
                <p className="mt-1 text-lg">
                  {"★".repeat(order.satisfactionRating || 0)}
                  {"☆".repeat(5 - (order.satisfactionRating || 0))}
                </p>
                {order.satisfactionComment && (
                  <p className="mt-1 text-xs text-ink/70">"{order.satisfactionComment}"</p>
                )}
              </div>
            ) : (
              <>
                <RegenerateSection
                  orderId={order.id}
                  plan={order.plan}
                  regenerationsUsed={order.regenerationsUsed}
                  onRegenerated={() => load(true)}
                />
                <SatisfactionSection orderId={order.id} onDelivered={() => load(true)} />
              </>
            )}
          </div>
        )}

        {showWaiting && order && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <StatusBadge status={order.status} />
            <p className="mt-4 font-display text-xl font-semibold text-ink">
              {order.destination.name}, {order.destination.state}
            </p>
            <p className="mt-2 max-w-sm text-sm text-muted">
              {STATUS_MESSAGES[order.status] ||
                "We're working on it — this page will show your full itinerary once it's ready."}
            </p>
            {order.status === "under_review" && (
              <p className="mt-1 text-xs text-muted">
                {order.plan === "plus" ? "Travelly Plus" : "Explorer"} orders are typically ready
                within {order.plan === "plus" ? "1 hour" : "30 minutes"}.
              </p>
            )}
            <button
              onClick={handleCheckAgain}
              disabled={checking}
              className="mt-6 rounded-full border border-brand px-6 py-2.5 text-sm font-medium text-brand transition hover:bg-brand-light disabled:opacity-60"
            >
              {checking ? "Checking…" : "Check again"}
            </button>
            <p className="mt-4 text-xs text-muted">
              You can also find this trip anytime from{" "}
              <a href="/trips" className="font-medium text-brand hover:underline">
                My Trips
              </a>
              .
            </p>
          </div>
        )}
      </main>
    </>
  );
}

function EmailItinerary({ orderId }: { orderId: string }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [emailError, setEmailError] = useState("");

  async function handleSend() {
    setSending(true);
    setEmailError("");
    try {
      const res = await fetch(`/api/orders/${orderId}/email`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Could not send the email.");
      }
      setSent(true);
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-3 text-center">
      {!sent ? (
        <button
          onClick={handleSend}
          disabled={sending}
          className="text-sm font-medium text-brand hover:underline disabled:opacity-60"
        >
          {sending ? "Sending…" : "Email me this itinerary"}
        </button>
      ) : (
        <p className="text-sm text-verified">Sent! Check your inbox.</p>
      )}
      {emailError && <p className="mt-1 text-xs text-red-600">{emailError}</p>}
    </div>
  );
}

function RegenerateSection({
  orderId,
  plan,
  regenerationsUsed,
  onRegenerated,
}: {
  orderId: string;
  plan: PlanTier;
  regenerationsUsed: number;
  onRegenerated: () => void;
}) {
  const limit = REGENERATION_LIMITS[plan];
  const remaining = limit - regenerationsUsed;
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  if (submitted) {
    return (
      <p className="mt-6 text-center text-sm text-verified">
        Your regeneration request has been sent to our team — we'll update this page once it's ready.
      </p>
    );
  }

  if (remaining <= 0) {
    return (
      <p className="mt-6 text-center text-xs text-muted">
        You've used all {limit} regeneration{limit > 1 ? "s" : ""} for this trip.
      </p>
    );
  }

  async function handleRegenerate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${orderId}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Could not submit your request.");
      }
      setSubmitted(true);
      onRegenerated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 text-center">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="text-sm font-medium text-brand hover:underline"
        >
          Not quite right? Request changes ({remaining} of {limit} left)
        </button>
      ) : (
        <div className="mx-auto max-w-sm rounded-xl2 border border-line bg-surface p-4 text-left shadow-soft">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink">
              What would you like different? (optional)
            </span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="e.g. Less walking, more food spots"
              className="w-full rounded-xl border border-line px-3 py-2 text-sm"
            />
          </label>
          <p className="mt-2 text-xs text-muted">
            This goes to our team to rework — it isn't instant, but we'll have it ready soon.
          </p>
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleRegenerate}
              disabled={loading}
              className="flex-1 rounded-full bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
            >
              {loading ? "Sending…" : "Send request"}
            </button>
            <button
              onClick={() => setOpen(false)}
              disabled={loading}
              className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink/70"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SatisfactionSection({
  orderId,
  onDelivered,
}: {
  orderId: string;
  onDelivered: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (rating < 1) {
      setError("Please pick a star rating.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${orderId}/satisfaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: comment.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Could not save your feedback.");
      }
      onDelivered();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 text-center">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="text-sm font-medium text-verified hover:underline"
        >
          Happy with this itinerary? Mark as delivered
        </button>
      ) : (
        <div className="mx-auto max-w-sm rounded-xl2 border border-verified-border bg-verified-bg p-4 text-left shadow-soft">
          <p className="mb-2 text-sm font-medium text-ink">How was your itinerary?</p>
          <div className="flex gap-1 text-2xl">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className={n <= rating ? "text-yellow-500" : "text-gray-300"}
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            placeholder="Any comments? (optional)"
            className="mt-3 w-full rounded-xl border border-line px-3 py-2 text-sm"
          />
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 rounded-full bg-verified px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Saving…" : "Submit"}
            </button>
            <button
              onClick={() => setOpen(false)}
              disabled={loading}
              className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink/70"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
