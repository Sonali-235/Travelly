"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { PlanCard } from "@/components/PlanCard";
import { openRazorpayCheckout } from "@/lib/razorpay-client";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Destination, PLAN_PRICES, PlanTier, TripRequest } from "@/lib/types";

const SKIP_PAYMENT = process.env.NEXT_PUBLIC_SKIP_PAYMENT === "true";

export default function CheckoutPage() {
  const router = useRouter();
  const [trip, setTrip] = useState<TripRequest | null>(null);
  const [destination, setDestination] = useState<Destination | null>(null);
  const [plan, setPlan] = useState<PlanTier>("plus");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/login?redirect=/checkout");
        return;
      }
      setName((prev) => prev || data.user.user_metadata?.full_name || "");
      setCheckingAuth(false);
    });
  }, [router]);

  useEffect(() => {
    const raw = sessionStorage.getItem("travelly_trip_request");
    if (!raw) {
      router.replace("/plan");
      return;
    }
    const parsedTrip = JSON.parse(raw) as TripRequest;
    setTrip(parsedTrip);

    fetch("/api/destinations")
      .then((res) => res.json())
      .then((data: Destination[]) => {
        const found = data.find((d) => d.id === parsedTrip.destinationId);
        if (found) setDestination(found);
      })
      .catch(() => {
        // Non-fatal — checkout can proceed without the display name.
      });
  }, [router]);

  if (!trip || checkingAuth) return null;

  async function handlePay() {
    setError("");
    if (!name.trim() || phone.trim().length < 10) {
      setError("Please enter your name and a valid phone number.");
      return;
    }
    setLoading(true);

    try {
      if (SKIP_PAYMENT) {
        // Phase 1/2 test bypass — no real payment, no real OTP.
        await createOrderAndFinish("test_payment_" + Date.now());
        return;
      }

      const orderRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (!orderRes.ok) throw new Error("Could not start payment. Please try again.");
      const razorpayOrder = await orderRes.json();

      await openRazorpayCheckout({
        orderId: razorpayOrder.id,
        amountPaise: razorpayOrder.amount,
        customerName: name,
        customerPhone: phone,
        description: `Travelly ${plan === "plus" ? "Plus" : "Explorer"} — ${destination?.name ?? ""}`,
        onSuccess: (paymentId, razorpayOrderId, signature) => {
          verifyAndFinish(paymentId, razorpayOrderId, signature);
        },
        onDismiss: () => setLoading(false),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  async function verifyAndFinish(paymentId: string, orderId: string, signature: string) {
    try {
      const res = await fetch("/api/razorpay/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, orderId, signature }),
      });
      if (!res.ok) throw new Error("Payment could not be verified.");
      await createOrderAndFinish(paymentId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment verification failed.");
      setLoading(false);
    }
  }

  async function createOrderAndFinish(paymentId: string) {
    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trip,
          customer: { name, phone },
          plan,
          paymentId,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Could not save your order.");
      }
      const { orderId } = await res.json();
      sessionStorage.setItem("travelly_order_id", orderId);
      sessionStorage.setItem("travelly_order_meta", JSON.stringify({ plan, name }));
      router.push("/itinerary");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-5 pb-24">
        <h1 className="mt-8 font-display text-2xl font-semibold text-ink">
          Choose your plan
        </h1>
        <p className="mt-1 text-sm text-muted">
          {destination ? `${destination.name}, ${destination.state}` : ""} · {trip.days} days
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <PlanCard
            tier="explorer"
            price={PLAN_PRICES.explorer}
            deliveryTime="30 minutes"
            selected={plan === "explorer"}
            onSelect={() => setPlan("explorer")}
          />
          <PlanCard
            tier="plus"
            price={PLAN_PRICES.plus}
            deliveryTime="1 hour"
            selected={plan === "plus"}
            onSelect={() => setPlan("plus")}
          />
        </div>

        <div className="mt-8 space-y-4 rounded-xl2 border border-line bg-surface p-5 shadow-soft">
          <h2 className="font-display text-base font-semibold text-ink">Your details</h2>
          <p className="text-xs text-muted">
            You're logged in — this just saves your name and a contact number
            with your order.
          </p>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink">Full name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-line px-3 py-2 text-sm"
              placeholder="Your name"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink">Phone number</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-line px-3 py-2 text-sm"
              placeholder="10-digit mobile number"
              inputMode="numeric"
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            onClick={handlePay}
            disabled={loading}
            className="w-full rounded-full bg-brand px-6 py-3 text-sm font-medium text-white shadow-soft transition hover:bg-brand-dark disabled:opacity-60"
          >
            {loading
              ? "Processing…"
              : SKIP_PAYMENT
              ? `Continue (test mode — no charge) · ₹${PLAN_PRICES[plan]}`
              : `Pay ₹${PLAN_PRICES[plan]} securely`}
          </button>
        </div>
      </main>
    </>
  );
}
