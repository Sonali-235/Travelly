import { NextRequest, NextResponse } from "next/server";
import { getDestinationById } from "@/lib/destinations-db";
import { generateItineraryWithGemini } from "@/lib/gemini";
import { applyRegeneration, getOrderById } from "@/lib/orders-db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/supabase-server";
import { REGENERATION_LIMITS } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const ip = getClientIp(req);
  const { allowed } = checkRateLimit(`regenerate:${ip}`, 10, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Please log in first." }, { status: 401 });
    }

    const order = await getOrderById(params.id);
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    if (order.userId !== user.id) {
      return NextResponse.json({ error: "Not authorized for this order." }, { status: 403 });
    }
    if (order.status !== "ready" && order.status !== "delivered") {
      return NextResponse.json({ error: "This itinerary isn't ready yet." }, { status: 400 });
    }

    const limit = REGENERATION_LIMITS[order.plan];
    if (order.regenerationsUsed >= limit) {
      return NextResponse.json(
        {
          error:
            order.plan === "plus"
              ? "You've used both free regenerations for this trip."
              : "Explorer plan includes 1 free regeneration, already used. Upgrade to Plus for a second try.",
        },
        { status: 403 }
      );
    }

    const { reason } = await req.json().catch(() => ({ reason: undefined }));

    const destination = await getDestinationById(order.destinationId);
    if (!destination) {
      return NextResponse.json({ error: "Destination not found." }, { status: 404 });
    }

    const itinerary = await generateItineraryWithGemini(destination, order.tripRequest, reason);
    await applyRegeneration(order.id, itinerary, order.regenerationsUsed + 1);

    return NextResponse.json({ ok: true, regenerationsUsed: order.regenerationsUsed + 1 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not regenerate itinerary." },
      { status: 500 }
    );
  }
}
