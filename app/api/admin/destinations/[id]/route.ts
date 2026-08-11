import { NextRequest, NextResponse } from "next/server";
import { deleteDestination } from "@/lib/destinations-db";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await deleteDestination(params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not delete destination." },
      { status: 500 }
    );
  }
}
