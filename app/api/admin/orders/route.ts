import { NextResponse } from "next/server";
import { listAllOrders } from "@/lib/orders-db";

const NO_STORE_HEADERS = { "Cache-Control": "no-store, must-revalidate" };

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const orders = await listAllOrders();
    return NextResponse.json(orders, { headers: NO_STORE_HEADERS });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not load orders." },
      { status: 500 }
    );
  }
}
