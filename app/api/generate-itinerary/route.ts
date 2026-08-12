import { NextRequest, NextResponse } from "next/server";
import { generateItineraryWithGemini } from "@/lib/gemini";
import { getDestinationById } from "@/lib/destinations-db";
import { getOrderById, updateOrderStatus } from "@/lib/orders-db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed } = checkRateLimit(`generate:${ip}`, 10, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  try {
    const { orderId } = await req.json();
    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId." }, { status: 400 });
    }

    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    if (order.userId !== user.id) {
      return NextResponse.json({ error: "Not authorized for this order." }, { status: 403 });
    }

    // Already generated (e.g. page was refreshed) — just return what we have,
    // don't call Claude again and don't charge another API call.
    if (order.itinerary) {
      const destination = await getDestinationById(order.destinationId);
      return NextResponse.json({ itinerary: order.itinerary, destination });
    }

    const destination = await getDestinationById(order.destinationId);
    if (!destination) {
      return NextResponse.json(
        { error: "We don't cover that destination yet." },
        { status: 400 }
      );
    }

    if (destination.verified.isSampleData) {
      console.warn(
        `[travelly] WARNING: destination "${destination.id}" is still using sample/placeholder verified data.`
      );
    }

    await updateOrderStatus(order.id, "ai_processing");

    const itinerary = await generateItineraryWithGemini(destination, order.tripRequest);

    await updateOrderStatus(order.id, "ready", itinerary);

    return NextResponse.json({ itinerary, destination });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error." },
      { status: 500 }
    );
  }
}
