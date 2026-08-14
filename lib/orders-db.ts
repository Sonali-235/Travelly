import { getSupabaseClient } from "./supabase";
import { CustomerInfo, GeneratedItinerary, OrderRecord, PlanTier, TripRequest } from "./types";

export interface StoredOrder {
  id: string;
  userId: string | null;
  destinationId: string;
  tripRequest: TripRequest;
  customer: CustomerInfo;
  plan: PlanTier;
  status: OrderRecord["status"];
  paymentId: string | null;
  itinerary: GeneratedItinerary | null;
  regenerationsUsed: number;
  hiddenFromCustomer: boolean;
  createdAt: string;
}

interface OrderRow {
  id: string;
  user_id: string | null;
  destination_id: string;
  trip_request: TripRequest;
  customer_name: string;
  customer_phone: string;
  plan: PlanTier;
  status: OrderRecord["status"];
  payment_id: string | null;
  itinerary: GeneratedItinerary | null;
  regenerations_used: number;
  hidden_from_customer: boolean;
  created_at: string;
}

function rowToOrder(row: OrderRow): StoredOrder {
  return {
    id: row.id,
    userId: row.user_id,
    destinationId: row.destination_id,
    tripRequest: row.trip_request,
    customer: { name: row.customer_name, phone: row.customer_phone },
    plan: row.plan,
    status: row.status,
    paymentId: row.payment_id,
    itinerary: row.itinerary,
    regenerationsUsed: row.regenerations_used ?? 0,
    hiddenFromCustomer: row.hidden_from_customer ?? false,
    createdAt: row.created_at,
  };
}

export async function createOrder(params: {
  userId: string;
  trip: TripRequest;
  customer: CustomerInfo;
  plan: PlanTier;
  paymentId: string;
}): Promise<StoredOrder> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .insert({
      user_id: params.userId,
      destination_id: params.trip.destinationId,
      trip_request: params.trip,
      customer_name: params.customer.name,
      customer_phone: params.customer.phone,
      plan: params.plan,
      payment_id: params.paymentId,
      status: "payment_successful",
    })
    .select("*")
    .single();

  if (error) throw new Error(`Could not create order: ${error.message}`);
  return rowToOrder(data as unknown as OrderRow);
}

export async function getOrderById(id: string): Promise<StoredOrder | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Could not load order: ${error.message}`);
  if (!data) return null;
  return rowToOrder(data as unknown as OrderRow);
}

export async function updateOrderStatus(
  id: string,
  status: OrderRecord["status"],
  itinerary?: GeneratedItinerary
): Promise<void> {
  const supabase = getSupabaseClient();
  const patch: Record<string, unknown> = { status };
  if (itinerary) patch.itinerary = itinerary;

  const { error } = await supabase.from("orders").update(patch).eq("id", id);
  if (error) throw new Error(`Could not update order: ${error.message}`);
}

/** Regeneration: bumps the counter and replaces the itinerary in one go. */
export async function applyRegeneration(
  id: string,
  itinerary: GeneratedItinerary,
  newRegenerationsUsed: number
): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("orders")
    .update({ itinerary, regenerations_used: newRegenerationsUsed, status: "ready" })
    .eq("id", id);
  if (error) throw new Error(`Could not regenerate itinerary: ${error.message}`);
}

/**
 * Soft delete only — this is what "delete" in My Trips actually calls.
 * The row stays in the database (admin's order history and revenue
 * records must never disappear just because a customer tidied up their
 * own view), it's just hidden from that customer's trip list.
 */
export async function hideOrderForCustomer(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("orders")
    .update({ hidden_from_customer: true })
    .eq("id", id);
  if (error) throw new Error(`Could not remove trip: ${error.message}`);
}

export async function getOrdersByUserId(userId: string): Promise<StoredOrder[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .eq("hidden_from_customer", false)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Could not load trips: ${error.message}`);
  return (data as unknown as OrderRow[]).map(rowToOrder);
}

export async function getOrdersByPhone(phone: string): Promise<StoredOrder[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("customer_phone", phone)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Could not load trips: ${error.message}`);
  return (data as unknown as OrderRow[]).map(rowToOrder);
}

export async function listAllOrders(): Promise<StoredOrder[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw new Error(`Could not load orders: ${error.message}`);
  return (data as unknown as OrderRow[]).map(rowToOrder);
}
