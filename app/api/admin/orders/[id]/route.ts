import { NextRequest, NextResponse } from "next/server";
import { getDestinationById } from "@/lib/destinations-db";
import { getOrderById, updateOrderStatus } from "@/lib/orders-db";
import { OrderRecord } from "@/lib/types";

export const dynamic = "force-dynamic";
const NO_STORE_HEADERS = { "Cache-Control": "no-store, must-revalidate" };

const VALID_STATUSES: OrderRecord["status"][] = [
  "awaiting_payment",
  "payment_successful",
  "ai_processing",
  "pending_review",
  "ready",
  "delivered",
];

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const order = await getOrderById(params.id);
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    const destination = await getDestinationById(order.destinationId);
    return NextResponse.json({ order, destination }, { headers: NO_STORE_HEADERS });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not load order." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { status } = await req.json();
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    await updateOrderStatus(params.id, status);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not update order." },
      { status: 500 }
    );
  }
}
