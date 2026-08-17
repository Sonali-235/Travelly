import { NextRequest, NextResponse } from "next/server";
import { getDestinationById } from "@/lib/destinations-db";
import { generateItineraryWithGemini } from "@/lib/gemini";
import { createOrder, updateOrderStatus } from "@/lib/orders-db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/supabase-server";
import { CustomerInfo, PlanTier, TripRequest } from "@/lib/types";

// Give this route extra time — it waits for the AI generation to finish
// before responding, so the order lands in "under_review" (with a draft
// ready for admin) immediately rather than needing a second request.
// 60s is the max on Vercel's free tier.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed } = checkRateLimit(`orders:${ip}`, 20, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  // Order ownership comes from the real, server-verified session — never
  // trust a user id sent in the request body.
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const trip = body.trip as TripRequest;
    const customer = body.customer as CustomerInfo;
    const plan = body.plan as PlanTier;
    const paymentId = body.paymentId as string;

    if (!trip || !customer?.name || !customer?.phone || !plan || !paymentId) {
      return NextResponse.json({ error: "Missing required order details." }, { status: 400 });
    }

    const order = await createOrder({ userId: user.id, trip, customer, plan, paymentId });

    // Kick off AI generation right away so a draft is ready by the time
    // admin reviews it — but never let a generation failure block the
    // order itself from having been placed successfully. The order stays
    // "under_review" the whole time (with or without a draft yet) — admin
    // can trigger generation manually from the review page as a fallback.
    try {
      const destination = await getDestinationById(trip.destinationId);
      if (destination) {
        const itinerary = await generateItineraryWithGemini(destination, trip);
        await updateOrderStatus(order.id, "under_review", itinerary);
      }
    } catch (genError) {
      console.error("Itinerary generation failed for order", order.id, genError);
    }

    return NextResponse.json({ orderId: order.id });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not create order." },
      { status: 500 }
    );
  }
}
