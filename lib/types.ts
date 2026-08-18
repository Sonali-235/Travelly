// ---- Plan tiers ----
export type PlanTier = "explorer" | "plus";

export const PLAN_PRICES: Record<PlanTier, number> = {
  explorer: 49,
  plus: 99,
};

export const PLAN_LABELS: Record<PlanTier, string> = {
  explorer: "Explorer",
  plus: "Travelly Plus",
};

export const REGENERATION_LIMITS: Record<PlanTier, number> = {
  explorer: 2,
  plus: 4,
};

// Customer can only request a regeneration within this many days of the
// itinerary becoming "ready" — after that, the option disappears (they can
// still mark themselves satisfied any time, just not request changes).
export const REGENERATION_WINDOW_DAYS = 2;

// ---- Trip planner form ----
export type BudgetStyle = "budget" | "mid-range" | "luxury";
export type TravelPace = "relaxed" | "balanced" | "packed";
export type TravelMode = "train" | "bus" | "car" | "flight" | "self-drive" | "bike";

export interface TripRequest {
  destinationId: string;
  departureCity: string;
  days: number;
  startDate: string; // ISO date
  adults: number;
  children: number;
  infants: number;
  budgetStyle: BudgetStyle;
  pace: TravelPace;
  travelMode: TravelMode;
  mustVisit: string;
  placesToAvoid: string;
  additionalPreferences: string;
}

export interface CustomerInfo {
  name: string;
  phone: string;
}

// ---- Verified (admin-owned) destination data ----
export interface VerifiedHotel {
  name: string;
  category: BudgetStyle;
  pricePerNight: string;
  contact: string;
  mapsQuery: string;
}

export interface VerifiedRestaurant {
  name: string;
  cuisine: string;
  priceRange: string;
  mapsQuery: string;
}

export interface VerifiedAttraction {
  name: string;
  entryFee: string;
  openingHours: string;
  mapsQuery: string;
  photographyAllowed: boolean;
  notes?: string;
}

export interface EmergencyContact {
  label: string;
  number: string;
}

export interface SmartWarning {
  type: string;
  message: string;
}

export interface ShoppingSpot {
  name: string;
  specialty: string;
}

export interface Destination {
  id: string;
  name: string;
  state: string;
  tagline: string;
  bestSeason: string;
  accentEmoji: string;
  overview: string;
  verified: {
    hotels: VerifiedHotel[];
    restaurants: VerifiedRestaurant[];
    attractions: VerifiedAttraction[];
    emergencyContacts: EmergencyContact[];
    localFood: string[];
    shopping: ShoppingSpot[];
    smartWarnings: SmartWarning[];
    permits?: string;
    transportTips: string;
    lastVerifiedOn: string;
    isSampleData: boolean; // true = placeholder, must be replaced before launch
  };
}

// ---- AI-generated itinerary ----
export interface DayPlan {
  day: number;
  title: string;
  morning: string;
  afternoon: string;
  evening: string;
  whyThisPlan: string;
}

export interface GeneratedItinerary {
  tripOverview: string;
  days: DayPlan[];
  estimatedBudget: {
    category: string;
    amount: string;
  }[];
  packingChecklist: string[];
  travelTips: string[];
  photographySuggestions: string[];
}

// Four statuses, matching exactly what both admin and the customer actually
// need to see and act on:
//   under_review — payment done, AI has drafted (or is drafting) the plan,
//                   admin needs to check/edit it before it's visible
//   ready         — admin approved it, customer can see the full itinerary
//   regenerating  — customer asked for changes; admin needs to reprocess it
//                   (does NOT call the AI automatically — an admin action does)
//   delivered     — customer confirmed they're happy with it (rating + comment).
//                   Final state — no more edits or regenerations after this.
export type OrderStatus = "under_review" | "ready" | "regenerating" | "delivered";

export interface OrderRecord {
  tripRequest: TripRequest;
  customer: CustomerInfo;
  plan: PlanTier;
  status: OrderStatus;
  paymentId?: string;
}
