import { NextRequest, NextResponse } from "next/server";
import { createOrder } from "@/lib/orders-db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/supabase-server";
import { CustomerInfo, PlanTier, TripRequest } from "@/lib/types";

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
    return NextResponse.json({ orderId: order.id });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not create order." },
      { status: 500 }
    );
  }
}
