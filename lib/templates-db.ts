import { getSupabaseClient } from "./supabase";
import { BudgetStyle, GeneratedItinerary, TravelPace } from "./types";

export interface ItineraryTemplate {
  id: string;
  destinationId: string;
  days: number;
  budgetStyle: BudgetStyle;
  pace: TravelPace;
  itinerary: GeneratedItinerary | null;
  status: "draft" | "approved";
  updatedAt: string;
}

interface TemplateRow {
  id: string;
  destination_id: string;
  days: number;
  budget_style: BudgetStyle;
  pace: TravelPace;
  itinerary: GeneratedItinerary | null;
  status: "draft" | "approved";
  updated_at: string;
}

function rowToTemplate(row: TemplateRow): ItineraryTemplate {
  return {
    id: row.id,
    destinationId: row.destination_id,
    days: row.days,
    budgetStyle: row.budget_style,
    pace: row.pace,
    itinerary: row.itinerary,
    status: row.status,
    updatedAt: row.updated_at,
  };
}

export async function getApprovedTemplateCounts(): Promise<Record<string, number>> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("itinerary_templates")
    .select("destination_id")
    .eq("status", "approved");

  if (error) throw new Error(`Could not load template counts: ${error.message}`);
  const counts: Record<string, number> = {};
  for (const row of data as { destination_id: string }[]) {
    counts[row.destination_id] = (counts[row.destination_id] || 0) + 1;
  }
  return counts;
}

export async function listTemplatesForDestination(
  destinationId: string
): Promise<ItineraryTemplate[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("itinerary_templates")
    .select("*")
    .eq("destination_id", destinationId)
    .order("days", { ascending: true });

  if (error) throw new Error(`Could not load templates: ${error.message}`);
  return (data as unknown as TemplateRow[]).map(rowToTemplate);
}

export async function getTemplateById(id: string): Promise<ItineraryTemplate | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("itinerary_templates")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Could not load template: ${error.message}`);
  if (!data) return null;
  return rowToTemplate(data as unknown as TemplateRow);
}

/**
 * The core of instant delivery: looks for an admin-approved template that
 * exactly matches this combination. Returns null if none exists yet — the
 * caller should fall back to live generation in that case.
 */
export async function findApprovedTemplate(
  destinationId: string,
  days: number,
  budgetStyle: BudgetStyle,
  pace: TravelPace
): Promise<ItineraryTemplate | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("itinerary_templates")
    .select("*")
    .eq("destination_id", destinationId)
    .eq("days", days)
    .eq("budget_style", budgetStyle)
    .eq("pace", pace)
    .eq("status", "approved")
    .maybeSingle();

  if (error) throw new Error(`Could not look up template: ${error.message}`);
  if (!data) return null;
  return rowToTemplate(data as unknown as TemplateRow);
}

/** Creates the row (empty, no itinerary yet) if it doesn't already exist. */
export async function ensureTemplateSlot(
  destinationId: string,
  days: number,
  budgetStyle: BudgetStyle,
  pace: TravelPace
): Promise<ItineraryTemplate> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("itinerary_templates")
    .upsert(
      { destination_id: destinationId, days, budget_style: budgetStyle, pace },
      { onConflict: "destination_id,days,budget_style,pace", ignoreDuplicates: true }
    )
    .select("*")
    .maybeSingle();

  if (error) throw new Error(`Could not create template slot: ${error.message}`);
  if (data) return rowToTemplate(data as unknown as TemplateRow);

  // ignoreDuplicates means an existing row returns no data — fetch it instead.
  const existing = await findApprovedTemplate(destinationId, days, budgetStyle, pace);
  if (existing) return existing;

  const { data: refetched, error: refetchError } = await supabase
    .from("itinerary_templates")
    .select("*")
    .eq("destination_id", destinationId)
    .eq("days", days)
    .eq("budget_style", budgetStyle)
    .eq("pace", pace)
    .single();
  if (refetchError) throw new Error(`Could not load template slot: ${refetchError.message}`);
  return rowToTemplate(refetched as unknown as TemplateRow);
}

export async function saveTemplateDraft(
  id: string,
  itinerary: GeneratedItinerary
): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("itinerary_templates")
    .update({ itinerary, status: "draft" })
    .eq("id", id);
  if (error) throw new Error(`Could not save template: ${error.message}`);
}

export async function approveTemplate(id: string, itinerary?: GeneratedItinerary): Promise<void> {
  const supabase = getSupabaseClient();
  const patch: Record<string, unknown> = { status: "approved" };
  if (itinerary) patch.itinerary = itinerary;
  const { error } = await supabase.from("itinerary_templates").update(patch).eq("id", id);
  if (error) throw new Error(`Could not approve template: ${error.message}`);
}

export async function deleteTemplate(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("itinerary_templates").delete().eq("id", id);
  if (error) throw new Error(`Could not delete template: ${error.message}`);
}
