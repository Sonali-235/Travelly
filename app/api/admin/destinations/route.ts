import { NextRequest, NextResponse } from "next/server";
import { listDestinations, upsertDestination } from "@/lib/destinations-db";
import { getApprovedTemplateCounts } from "@/lib/templates-db";
import { Destination } from "@/lib/types";

const NO_STORE_HEADERS = { "Cache-Control": "no-store, must-revalidate" };

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [destinations, templateCounts] = await Promise.all([
      listDestinations(),
      getApprovedTemplateCounts(),
    ]);
    const withCounts = destinations.map((d) => ({
      ...d,
      approvedTemplateCount: templateCounts[d.id] || 0,
    }));
    return NextResponse.json(withCounts, { headers: NO_STORE_HEADERS });
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
