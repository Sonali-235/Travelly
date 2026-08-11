import { NextRequest, NextResponse } from "next/server";
import { listDestinations, upsertDestination } from "@/lib/destinations-db";
import { Destination } from "@/lib/types";

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

export async function POST(req: NextRequest) {
  try {
    const destination = (await req.json()) as Destination;

    if (!destination.id || !destination.name || !destination.state) {
      return NextResponse.json(
        { error: "id, name, and state are required." },
        { status: 400 }
      );
    }
    if (!/^[a-z0-9-]+$/.test(destination.id)) {
      return NextResponse.json(
        { error: "id must be lowercase letters, numbers, and hyphens only (e.g. 'goa')." },
        { status: 400 }
      );
    }

    await upsertDestination(destination);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not save destination." },
      { status: 500 }
    );
  }
}
