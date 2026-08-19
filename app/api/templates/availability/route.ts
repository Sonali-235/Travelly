import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { findApprovedTemplate } from "@/lib/templates-db";
import { BudgetStyle, TravelPace } from "@/lib/types";

export const dynamic = "force-dynamic";
const NO_STORE_HEADERS = { "Cache-Control": "no-store, must-revalidate" };

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed } = checkRateLimit(`avail:${ip}`, 30, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  try {
    const params = req.nextUrl.searchParams;
    const destinationId = params.get("destinationId");
    const days = Number(params.get("days"));
    const budgetStyle = params.get("budgetStyle") as BudgetStyle | null;
    const pace = params.get("pace") as TravelPace | null;

    if (!destinationId || !days || !budgetStyle || !pace) {
      return NextResponse.json(
        { error: "destinationId, days, budgetStyle, and pace are all required." },
        { status: 400 }
      );
    }

    const template = await findApprovedTemplate(destinationId, days, budgetStyle, pace);
    return NextResponse.json({ available: !!template }, { headers: NO_STORE_HEADERS });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not check availability." },
      { status: 500 }
    );
  }
}
