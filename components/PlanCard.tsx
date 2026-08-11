import { PlanTier } from "@/lib/types";

const FEATURES: Record<PlanTier, string[]> = {
  explorer: [
    "Destination overview",
    "Day-wise itinerary",
    "Estimated budget",
    "Travel tips",
    "Packing checklist",
    "Places to visit",
  ],
  plus: [
    "Everything in Explorer, plus:",
    "Verified hotel recommendations",
    "Restaurant suggestions",
    "Google Maps links",
    "Verified entry fees",
    "Emergency contacts",
    "Shopping recommendations",
    "Photography spots",
    "Local food suggestions",
    "Smart warnings",
  ],
};

export function PlanCard({
  tier,
  price,
  deliveryTime,
  selected,
  onSelect,
}: {
  tier: PlanTier;
  price: number;
  deliveryTime: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const isPlus = tier === "plus";
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-xl2 border p-5 text-left shadow-soft transition ${
        selected
          ? "border-brand ring-2 ring-brand/30 bg-brand-light"
          : "border-line bg-surface hover:border-brand/40"
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-ink">
          {isPlus ? "Travelly Plus" : "Explorer"}
        </h3>
        {isPlus && (
          <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-medium text-white">
            Most trusted
          </span>
        )}
      </div>
      <p className="mt-1 text-2xl font-semibold text-ink">
        ₹{price}
        <span className="ml-1 text-sm font-normal text-muted">one-time</span>
      </p>
      <p className="mt-1 text-xs text-muted">Delivered within {deliveryTime}</p>
      <ul className="mt-4 space-y-1.5 text-sm text-ink/80">
        {FEATURES[tier].map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
            {f}
          </li>
        ))}
      </ul>
    </button>
  );
}
