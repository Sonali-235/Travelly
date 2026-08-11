import { NextResponse } from "next/server";
import { listAllOrders } from "@/lib/orders-db";

export async function GET() {
  try {
    const orders = await listAllOrders();
    return NextResponse.json(orders);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not load orders." },
      { status: 500 }
    );
  }
}
