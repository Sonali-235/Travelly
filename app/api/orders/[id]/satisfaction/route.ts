import { NextRequest, NextResponse } from "next/server";
import { getOrderById, markDelivered } from "@/lib/orders-db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/supabase-server";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const ip = getClientIp(req);
  const { allowed } = checkRateLimit(`satisfaction:${ip}`, 10, 60_000);
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
    if (order.status !== "ready") {
      return NextResponse.json(
        { error: "This trip isn't in a state that can be marked delivered." },
        { status: 400 }
      );
    }

    const { rating, comment } = await req.json();
    const numericRating = Number(rating);
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return NextResponse.json({ error: "Rating must be a whole number from 1 to 5." }, { status: 400 });
    }

    await markDelivered(order.id, numericRating, String(comment || "").trim());
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not save your feedback." },
      { status: 500 }
    );
  }
}
