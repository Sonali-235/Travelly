"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { ItineraryDisplay } from "@/components/ItineraryDisplay";
import { Destination, GeneratedItinerary, PlanTier } from "@/lib/types";

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
  const orderIdFromUrl = searchParams.get("order");

  const [destination, setDestination] = useState<Destination | null>(null);
  const [itinerary, setItinerary] = useState<GeneratedItinerary | null>(null);
  const [plan, setPlan] = useState<PlanTier>("explorer");
  const [travelerName, setTravelerName] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadExisting(orderId: string) {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        if (!res.ok) throw new Error("Could not find that trip.");
        const data = await res.json();
        if (cancelled) return;
        if (!data.itinerary) {
          // Order exists but hasn't finished generating yet (rare — e.g. the
          // browser was closed mid-generation). Fall back to generating it.
          await generateFor(orderId);
          return;
        }
        setDestination(data.destination);
        setItinerary(data.itinerary);
        setPlan(data.plan);
        setTravelerName(data.customerName);
        setStatus("ready");
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
          setStatus("error");
        }
      }
    }

    async function generateFor(orderId: string) {
      try {
        const res = await fetch("/api/generate-itinerary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Could not generate your itinerary.");
        }
        const data = await res.json();
        if (cancelled) return;
        setDestination(data.destination);
        setItinerary(data.itinerary);

        // Fresh-checkout flow doesn't have plan/name from this response —
        // pull them from sessionStorage where checkout left them.
        const rawOrder = sessionStorage.getItem("travelly_order_meta");
        if (rawOrder) {
          const meta = JSON.parse(rawOrder);
          setPlan(meta.plan);
          setTravelerName(meta.name);
        }
        setStatus("ready");
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
          setStatus("error");
        }
      }
    }

    if (orderIdFromUrl) {
      loadExisting(orderIdFromUrl);
      return;
    }

    const storedOrderId = sessionStorage.getItem("travelly_order_id");
    if (!storedOrderId) {
      router.replace("/plan");
      return;
    }
    generateFor(storedOrderId);

    return () => {
      cancelled = true;
    };
  }, [orderIdFromUrl, router]);

  function downloadAsText() {
    if (!itinerary || !destination) return;
    const lines: string[] = [];
    lines.push(`TRAVELLY — ${destination.name}, ${destination.state}`);
    lines.push(`Plan: ${plan === "plus" ? "Travelly Plus" : "Explorer"}`);
    lines.push("");
    lines.push(itinerary.tripOverview);
    lines.push("");
    itinerary.days.forEach((d) => {
      lines.push(`DAY ${d.day}: ${d.title}`);
      lines.push(`  Morning: ${d.morning}`);
      lines.push(`  Afternoon: ${d.afternoon}`);
      lines.push(`  Evening: ${d.evening}`);
      lines.push("");
    });
    lines.push("ESTIMATED BUDGET");
    itinerary.estimatedBudget.forEach((b) => lines.push(`  ${b.category}: ${b.amount}`));
    lines.push("");
    lines.push("PACKING CHECKLIST");
    itinerary.packingChecklist.forEach((p) => lines.push(`  - ${p}`));

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `travelly-${destination.id}-itinerary.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-5 pb-24">
        {status === "loading" && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            <p className="mt-4 font-display text-lg font-semibold text-ink">
              Planning your trip…
            </p>
            <p className="mt-1 text-sm text-muted">This usually takes under a minute.</p>
          </div>
        )}

        {status === "error" && (
          <div className="py-24 text-center">
            <p className="font-display text-lg font-semibold text-ink">
              We couldn't load your itinerary
            </p>
            <p className="mt-2 text-sm text-muted">{errorMsg}</p>
          </div>
        )}

        {status === "ready" && itinerary && destination && (
          <div className="py-8">
            <ItineraryDisplay
              destination={destination}
              itinerary={itinerary}
              plan={plan}
              travelerName={travelerName}
            />
            <button
              onClick={downloadAsText}
              className="mt-10 w-full rounded-full border border-brand px-6 py-3 text-sm font-medium text-brand transition hover:bg-brand-light"
            >
              Download as text file
            </button>
          </div>
        )}
      </main>
    </>
  );
}
