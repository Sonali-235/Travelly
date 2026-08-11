import { NextRequest, NextResponse } from "next/server";
import { getDestinationById } from "@/lib/destinations-db";
import { getOrderById } from "@/lib/orders-db";
import { getCurrentUser } from "@/lib/supabase-server";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const order = await getOrderById(params.id);
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const user = await getCurrentUser();
    if (!user || order.userId !== user.id) {
      return NextResponse.json({ error: "Not authorized to view this order." }, { status: 403 });
    }

    const destination = await getDestinationById(order.destinationId);
    if (!destination) {
      return NextResponse.json({ error: "Destination not found." }, { status: 404 });
    }

    return NextResponse.json({
      id: order.id,
      status: order.status,
      plan: order.plan,
      customerName: order.customer.name,
      tripRequest: order.tripRequest,
      itinerary: order.itinerary,
      destination,
      createdAt: order.createdAt,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not load order." },
      { status: 500 }
    );
  }
}
