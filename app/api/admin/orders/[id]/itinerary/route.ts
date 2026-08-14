import { NextRequest, NextResponse } from "next/server";
import { updateOrderItinerary } from "@/lib/orders-db";
import { GeneratedItinerary } from "@/lib/types";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const itinerary = (await req.json()) as GeneratedItinerary;

    if (!itinerary || !Array.isArray(itinerary.days)) {
      return NextResponse.json({ error: "Invalid itinerary data." }, { status: 400 });
    }

    await updateOrderItinerary(params.id, itinerary);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not save changes." },
      { status: 500 }
    );
  }
}
