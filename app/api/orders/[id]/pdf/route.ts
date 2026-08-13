import { NextRequest, NextResponse } from "next/server";
import { buildItineraryPdf } from "@/lib/pdf";
import { getOrderById } from "@/lib/orders-db";
import { getDestinationById } from "@/lib/destinations-db";
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

    if (!order.itinerary || (order.status !== "ready" && order.status !== "delivered")) {
      return NextResponse.json({ error: "This itinerary isn't ready yet." }, { status: 400 });
    }

    const destination = await getDestinationById(order.destinationId);
    if (!destination) {
      return NextResponse.json({ error: "Destination not found." }, { status: 404 });
    }

    const pdfBytes = await buildItineraryPdf(
      destination,
      order.itinerary,
      order.plan,
      order.customer.name
    );

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="travelly-${destination.id}-itinerary.pdf"`,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not generate PDF." },
      { status: 500 }
    );
  }
}
