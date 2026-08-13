import { NextResponse } from "next/server";
import { listDestinations } from "@/lib/destinations-db";

const NO_STORE_HEADERS = { "Cache-Control": "no-store, must-revalidate" };

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const destinations = await listDestinations();
    return NextResponse.json(destinations, { headers: NO_STORE_HEADERS });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not load destinations." },
      { status: 500 }
    );
  }
}
