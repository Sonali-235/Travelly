import { NextRequest, NextResponse } from "next/server";
import { getDestinationById } from "@/lib/destinations-db";
import { buildTemplateTripRequest, generateItineraryWithGemini } from "@/lib/gemini";
import { ensureTemplateSlot, saveTemplateDraft } from "@/lib/templates-db";
import { BudgetStyle, TravelPace } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { destinationId, days, budgetStyle, pace } = (await req.json()) as {
      destinationId: string;
      days: number;
      budgetStyle: BudgetStyle;
      pace: TravelPace;
    };

    if (!destinationId || !days || !budgetStyle || !pace) {
      return NextResponse.json(
        { error: "destinationId, days, budgetStyle, and pace are all required." },
        { status: 400 }
      );
    }

    const destination = await getDestinationById(destinationId);
    if (!destination) {
      return NextResponse.json({ error: "Destination not found." }, { status: 404 });
    }

    const slot = await ensureTemplateSlot(destinationId, days, budgetStyle, pace);
    const trip = buildTemplateTripRequest(destinationId, days, budgetStyle, pace);
    const itinerary = await generateItineraryWithGemini(destination, trip);
    await saveTemplateDraft(slot.id, itinerary);

    return NextResponse.json({ ok: true, templateId: slot.id });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not generate template." },
      { status: 500 }
    );
  }
}
