import { NextRequest, NextResponse } from "next/server";
import { getDestinationById } from "@/lib/destinations-db";
import { generateItineraryWithGemini } from "@/lib/gemini";
import { approveOrder, createOrder, updateOrderStatus } from "@/lib/orders-db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/supabase-server";
import { findApprovedTemplate } from "@/lib/templates-db";
import { CustomerInfo, PlanTier, TripRequest } from "@/lib/types";

// Give this route extra time — the live-generation fallback path waits for
// AI to finish before responding. The instant-template path (the common
// case once templates exist) returns almost immediately.
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

    // 1. Instant path: an admin-approved template matching destination +
    // days + budget style + pace already exists — use it immediately, no
    // waiting, no per-order admin review (the template itself was already
    // reviewed once). This is the path most orders should take once a
    // destination's common combinations have been pre-generated.
    try {
      const template = await findApprovedTemplate(
        trip.destinationId,
        trip.days,
        trip.budgetStyle,
        trip.pace
      );
      if (template?.itinerary) {
        await approveOrder(order.id, template.itinerary);
        return NextResponse.json({ orderId: order.id });
      }
    } catch (templateError) {
      console.error("Template lookup failed for order", order.id, templateError);
      // Fall through to live generation below rather than failing the order.
    }

    // 2. Fallback path: no matching template yet — generate live and put it
    // through the normal admin-review flow, exactly as before this feature.
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
