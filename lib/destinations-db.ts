import { getSupabaseClient } from "./supabase";
import { Destination } from "./types";

interface DestinationRow {
  id: string;
  name: string;
  state: string;
  tagline: string | null;
  best_season: string | null;
  accent_emoji: string | null;
  overview: string | null;
  verified: Destination["verified"];
}

function rowToDestination(row: DestinationRow): Destination {
  return {
    id: row.id,
    name: row.name,
    state: row.state,
    tagline: row.tagline || "",
    bestSeason: row.best_season || "",
    accentEmoji: row.accent_emoji || "📍",
    overview: row.overview || "",
    verified: row.verified,
  };
}

export async function listDestinations(): Promise<Destination[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("destinations")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw new Error(`Could not load destinations: ${error.message}`);
  return (data as unknown as DestinationRow[]).map(rowToDestination);
}

export async function getDestinationById(id: string): Promise<Destination | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("destinations")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Could not load destination: ${error.message}`);
  if (!data) return null;
  return rowToDestination(data as unknown as DestinationRow);
}

export async function upsertDestination(destination: Destination): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("destinations").upsert({
    id: destination.id,
    name: destination.name,
    state: destination.state,
    tagline: destination.tagline,
    best_season: destination.bestSeason,
    accent_emoji: destination.accentEmoji,
    overview: destination.overview,
    verified: destination.verified,
  });

  if (error) throw new Error(`Could not save destination: ${error.message}`);
}

export async function deleteDestination(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("destinations").delete().eq("id", id);
  if (error) throw new Error(`Could not delete destination: ${error.message}`);
}
