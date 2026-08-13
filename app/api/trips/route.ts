import { NextResponse } from "next/server";
import { listDestinations } from "@/lib/destinations-db";
import { getOrdersByUserId } from "@/lib/orders-db";
import { getCurrentUser } from "@/lib/supabase-server";

const NO_STORE_HEADERS = { "Cache-Control": "no-store, must-revalidate" };

export const dynamic = "force-dynamic";

// Real, session-based "my trips" — replaces the earlier phone-number-only
// lookup. Only returns orders that belong to the logged-in user.
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not logged in." }, { status: 401 });
    }

    const orders = await getOrdersByUserId(user.id);
    const destinations = await listDestinations();
    const destinationMap = new Map(destinations.map((d) => [d.id, d]));

    const summaries = orders.map((o) => {
      const dest = destinationMap.get(o.destinationId);
      return {
        id: o.id,
        destinationName: dest ? `${dest.name}, ${dest.state}` : o.destinationId,
        plan: o.plan,
        status: o.status,
        createdAt: o.createdAt,
      };
    });

    return NextResponse.json(summaries, { headers: NO_STORE_HEADERS });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not load trips." },
      { status: 500 }
    );
  }
}
