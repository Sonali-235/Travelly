import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { PLAN_PRICES, PlanTier } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { plan } = (await req.json()) as { plan: PlanTier };
    if (!plan || !(plan in PLAN_PRICES)) {
      return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: "Payment is not configured on the server yet." },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const amountInPaise = PLAN_PRICES[plan] * 100;
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `travelly_${plan}_${Date.now()}`,
    });

    return NextResponse.json(order);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not create order." },
      { status: 500 }
    );
  }
}
