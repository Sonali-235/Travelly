import { NextRequest, NextResponse } from "next/server";
import { listTemplatesForDestination } from "@/lib/templates-db";

export const dynamic = "force-dynamic";
const NO_STORE_HEADERS = { "Cache-Control": "no-store, must-revalidate" };

export async function GET(req: NextRequest) {
  try {
    const destinationId = req.nextUrl.searchParams.get("destinationId");
    if (!destinationId) {
      return NextResponse.json({ error: "destinationId is required." }, { status: 400 });
    }
    const templates = await listTemplatesForDestination(destinationId);
    return NextResponse.json(templates, { headers: NO_STORE_HEADERS });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not load templates." },
      { status: 500 }
    );
  }
}
