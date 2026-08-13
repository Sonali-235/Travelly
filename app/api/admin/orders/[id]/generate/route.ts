import { NextRequest, NextResponse } from "next/server";
import { getDestinationById } from "@/lib/destinations-db";
import { generateItineraryWithGemini } from "@/lib/gemini";
import { getOrderById, updateOrderStatus } from "@/lib/orders-db";

export const maxDuration = 60;

// Admin-only fallback trigger — used when automatic generation failed at
// checkout (e.g. a Gemini hiccup) or when admin wants to regenerate before
// approving. Protected by middleware (matches /api/admin/:path*).
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

    await updateOrderStatus(order.id, "ai_processing");
    const itinerary = await generateItineraryWithGemini(destination, order.tripRequest);
    await updateOrderStatus(order.id, "pending_review", itinerary);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not generate itinerary." },
      { status: 500 }
    );
  }
}
