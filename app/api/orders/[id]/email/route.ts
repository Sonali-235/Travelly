import { NextRequest, NextResponse } from "next/server";
import { getDestinationById } from "@/lib/destinations-db";
import { getOrderById } from "@/lib/orders-db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/supabase-server";

function buildEmailHtml(
  destinationName: string,
  overview: string,
  days: { day: number; title: string; morning: string; afternoon: string; evening: string }[]
): string {
  const dayBlocks = days
    .map(
      (d) => `
      <h3 style="margin:20px 0 6px;font-size:15px;">Day ${d.day}: ${d.title}</h3>
      <p style="margin:4px 0;font-size:13px;"><strong>Morning:</strong> ${d.morning}</p>
      <p style="margin:4px 0;font-size:13px;"><strong>Afternoon:</strong> ${d.afternoon}</p>
      <p style="margin:4px 0;font-size:13px;"><strong>Evening:</strong> ${d.evening}</p>`
    )
    .join("");

  return `
    <div style="font-family:sans-serif;color:#111827;max-width:560px;margin:0 auto;">
      <h1 style="color:#2563EB;font-size:20px;">Travelly</h1>
      <h2 style="font-size:17px;">${destinationName}</h2>
      <p style="font-size:13px;color:#4b5563;">${overview}</p>
      ${dayBlocks}
      <p style="margin-top:24px;font-size:12px;color:#6b7280;">
        Sent from Travelly. Log in to see your full itinerary with verified hotels,
        entry fees, and emergency contacts anytime.
      </p>
    </div>
  `;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const ip = getClientIp(req);
  const { allowed } = checkRateLimit(`email:${ip}`, 5, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Email sending isn't set up yet — add a free Resend API key to enable this." },
      { status: 501 }
    );
  }

  try {
    const order = await getOrderById(params.id);
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const user = await getCurrentUser();
    if (!user || order.userId !== user.id) {
      return NextResponse.json({ error: "Not authorized for this order." }, { status: 403 });
    }
    if (!user.email) {
      return NextResponse.json({ error: "No email address on your account." }, { status: 400 });
    }
    if (!order.itinerary || (order.status !== "ready" && order.status !== "delivered")) {
      return NextResponse.json({ error: "This itinerary isn't ready yet." }, { status: 400 });
    }

    const destination = await getDestinationById(order.destinationId);
    if (!destination) {
      return NextResponse.json({ error: "Destination not found." }, { status: 404 });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || "Travelly <onboarding@resend.dev>",
        to: [user.email],
        subject: `Your Travelly itinerary — ${destination.name}, ${destination.state}`,
        html: buildEmailHtml(
          `${destination.name}, ${destination.state}`,
          order.itinerary.tripOverview,
          order.itinerary.days
        ),
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Resend error (${res.status}): ${errBody}`);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not send email." },
      { status: 500 }
    );
  }
}
