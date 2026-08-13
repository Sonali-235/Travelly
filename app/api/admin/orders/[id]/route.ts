import { NextRequest, NextResponse } from "next/server";
import { updateOrderStatus } from "@/lib/orders-db";
import { OrderRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

const VALID_STATUSES: OrderRecord["status"][] = [
  "awaiting_payment",
  "payment_successful",
  "ai_processing",
  "pending_review",
  "ready",
  "delivered",
];

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
