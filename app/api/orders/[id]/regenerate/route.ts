import { NextRequest, NextResponse } from "next/server";
import { getOrderById, requestRegeneration } from "@/lib/orders-db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/supabase-server";
import { REGENERATION_LIMITS, REGENERATION_WINDOW_DAYS } from "@/lib/types";

// This does NOT call the AI. It only flags the order for admin to process —
// per the intended workflow, every draft (including regenerated ones) goes
// through admin review before a customer ever sees it. See
// /api/admin/orders/[id]/generate for where the actual regeneration happens.
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
    if (order.status !== "ready") {
      return NextResponse.json(
        { error: "This itinerary isn't in a state that can be regenerated right now." },
        { status: 400 }
      );
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

    if (order.readyAt) {
      const daysSinceReady = (Date.now() - new Date(order.readyAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceReady > REGENERATION_WINDOW_DAYS) {
        return NextResponse.json(
          {
            error: `Regeneration is only available within ${REGENERATION_WINDOW_DAYS} days of your itinerary being ready.`,
          },
          { status: 403 }
        );
      }
    }

    const { reason } = await req.json().catch(() => ({ reason: undefined }));
    await requestRegeneration(order.id, reason, order.regenerationsUsed + 1);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not request regeneration." },
      { status: 500 }
    );
  }
}
