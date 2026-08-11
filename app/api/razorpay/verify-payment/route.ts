import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { paymentId, orderId, signature } = await req.json();
    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      return NextResponse.json(
        { error: "Payment is not configured on the server yet." },
        { status: 500 }
      );
    }
    if (!paymentId || !orderId || !signature) {
      return NextResponse.json({ error: "Missing payment details." }, { status: 400 });
    }

    // Razorpay's official verification method: HMAC-SHA256 of "order_id|payment_id"
    // using your key secret, compared against the signature they send back.
    // https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/build-integration/#step-5-verify-payment-signature
    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    if (expected !== signature) {
      return NextResponse.json({ error: "Signature mismatch." }, { status: 400 });
    }

    return NextResponse.json({ verified: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Verification failed." },
      { status: 500 }
    );
  }
}
