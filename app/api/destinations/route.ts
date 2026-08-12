import { NextResponse } from "next/server";
import { listDestinations } from "@/lib/destinations-db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const destinations = await listDestinations();
    return NextResponse.json(destinations);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not load destinations." },
      { status: 500 }
    );
  }
}
