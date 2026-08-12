import { Destination, GeneratedItinerary, TripRequest } from "./types";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * Same responsibility split as before: Gemini writes the NARRATIVE and
 * SEQUENCING only. It's explicitly told never to invent prices, fees, phone
 * numbers, or opening hours — all factual data is merged in separately from
 * lib/destinations-db.ts (admin-verified).
 */
function buildSystemPrompt(): string {
  return `You are Travelly's itinerary-writing assistant.

You generate the NARRATIVE and SEQUENCING parts of a travel itinerary only.

You must NEVER invent or state: hotel prices, entry fees, phone numbers,
opening hours, ratings, permit details, or emergency contacts. If you need to
reference an attraction, refer to it only by name — never attach a price or
number to it. All of that factual data is supplied separately by a verified
admin database and merged in after your response.

Respond with ONLY a single valid JSON object — no markdown fences, no preamble,
no commentary before or after. Match exactly this shape:

{
  "tripOverview": "2-3 sentence overview of the trip tailored to this traveler",
  "days": [
    {
      "day": 1,
      "title": "short theme for the day",
      "morning": "what to do in the morning, referencing real attraction names by name only",
      "afternoon": "what to do in the afternoon",
      "evening": "what to do in the evening",
      "whyThisPlan": "1-2 sentences explaining why this fits their stated preferences"
    }
  ],
  "estimatedBudget": [
    { "category": "Stay", "amount": "e.g. ₹X,XXX – ₹Y,YYY (rough estimate)" },
    { "category": "Food", "amount": "..." },
    { "category": "Local Transport", "amount": "..." },
    { "category": "Activities/Entry Fees", "amount": "..." }
  ],
  "packingChecklist": ["item 1", "item 2"],
  "travelTips": ["tip 1", "tip 2"],
  "photographySuggestions": ["spot or moment 1", "spot or moment 2"]
}

Adjust pace, walking amount, and indoor/outdoor balance based on the traveler's
stated pace, travel mode, budget style, weather considerations for the season,
and any free-text preferences they gave. Keep language plain and warm, not
salesy. estimatedBudget amounts must be clearly labelled as rough AI estimates,
never stated as exact verified prices.`;
}

function buildUserPrompt(destination: Destination, trip: TripRequest): string {
  const attractionNames = destination.verified.attractions.map((a) => a.name).join(", ");
  const foodNames = destination.verified.localFood.join(", ");

  return `Destination: ${destination.name}, ${destination.state}
Best season note: ${destination.bestSeason}
Trip length: ${trip.days} days
Start date: ${trip.startDate}
Departure city: ${trip.departureCity}
Travelers: ${trip.adults} adults, ${trip.children} children, ${trip.infants} infants
Budget style: ${trip.budgetStyle}
Travel pace: ${trip.pace}
Travel mode: ${trip.travelMode}
Must-visit places: ${trip.mustVisit || "none specified"}
Places to avoid: ${trip.placesToAvoid || "none specified"}
Additional preferences: ${trip.additionalPreferences || "none specified"}

Known verified attractions to weave in by name where relevant (do not invent others
outside this list unless clearly generic, e.g. "a local market"): ${attractionNames}
Known local food to reference by name: ${foodNames}

Write a ${trip.days}-day itinerary as the JSON object described in your instructions.`;
}

export async function generateItineraryWithGemini(
  destination: Destination,
  trip: TripRequest
): Promise<GeneratedItinerary> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in the environment.");
  }

  // Check Google AI Studio (aistudio.google.com/apikey) for the current
  // best free-tier model name if this default ever stops working — Google
  // renames/retires models fairly often. Override via GEMINI_MODEL without
  // touching code.
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

  const response = await fetch(`${GEMINI_API_BASE}/${model}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: buildSystemPrompt() }] },
      contents: [{ role: "user", parts: [{ text: buildUserPrompt(destination, trip) }] }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini API returned no text content.");
  }

  const cleaned = text.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(cleaned) as GeneratedItinerary;
  } catch {
    throw new Error("Could not parse Gemini's response as JSON. Raw response: " + cleaned.slice(0, 500));
  }
}
