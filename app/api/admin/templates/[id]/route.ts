import { NextRequest, NextResponse } from "next/server";
import { approveTemplate, deleteTemplate, saveTemplateDraft } from "@/lib/templates-db";
import { GeneratedItinerary } from "@/lib/types";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();

    if (body.action === "approve") {
      await approveTemplate(params.id, body.itinerary as GeneratedItinerary | undefined);
      return NextResponse.json({ ok: true });
    }

    const itinerary = body.itinerary as GeneratedItinerary;
    if (!itinerary || !Array.isArray(itinerary.days)) {
      return NextResponse.json({ error: "Invalid itinerary data." }, { status: 400 });
    }
    await saveTemplateDraft(params.id, itinerary);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not save template." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await deleteTemplate(params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not delete template." },
      { status: 500 }
    );
  }
}
