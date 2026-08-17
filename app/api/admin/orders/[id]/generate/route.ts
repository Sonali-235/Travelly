import { NextRequest, NextResponse } from "next/server";
import { getDestinationById } from "@/lib/destinations-db";
import { generateItineraryWithGemini } from "@/lib/gemini";
import { getOrderById, updateOrderStatus } from "@/lib/orders-db";

export const maxDuration = 60;

// Admin-only trigger — covers two cases with the same action:
//   1. Fresh generation (order has no draft yet, e.g. checkout's automatic
//      attempt failed).
//   2. Processing a customer's regeneration request (order.status is
//      "regenerating") — reuses their stored reason as extra context.
// Either way, the result always lands back at "under_review" so admin
// reviews the draft before it's ever visible to the customer.
// Protected by middleware (matches /api/admin/:path*).
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const order = await getOrderById(params.id);
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const destination = await getDestinationById(order.destinationId);
    if (!destination) {
      return NextResponse.json({ error: "Destination not found." }, { status: 404 });
    }

    const itinerary = await generateItineraryWithGemini(
      destination,
      order.tripRequest,
      order.regenerationReason || undefined
    );
    await updateOrderStatus(order.id, "under_review", itinerary);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not generate itinerary." },
      { status: 500 }
    );
  }
}
