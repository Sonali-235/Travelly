"use client";

import { DayPlan, GeneratedItinerary } from "@/lib/types";
import { ListTextArea, RepeatableRows } from "./RepeatableFields";

interface Props {
  itinerary: GeneratedItinerary;
  onChange: (itinerary: GeneratedItinerary) => void;
}

export function ItineraryEditor({ itinerary, onChange }: Props) {
  function update<K extends keyof GeneratedItinerary>(key: K, value: GeneratedItinerary[K]) {
    onChange({ ...itinerary, [key]: value });
  }

  function updateDay(index: number, key: keyof DayPlan, value: string | number) {
    const days = itinerary.days.map((d, i) => (i === index ? { ...d, [key]: value } : d));
    update("days", days);
  }

  function removeDay(index: number) {
    update(
      "days",
      itinerary.days.filter((_, i) => i !== index)
    );
  }

  function addDay() {
    const nextDayNumber = itinerary.days.length + 1;
    update("days", [
      ...itinerary.days,
      { day: nextDayNumber, title: "", morning: "", afternoon: "", evening: "", whyThisPlan: "" },
    ]);
  }

  return (
    <div className="space-y-6">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink">Trip overview</span>
        <textarea
          value={itinerary.tripOverview}
          onChange={(e) => update("tripOverview", e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-line px-3 py-2 text-sm"
        />
      </label>

      <div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-ink">Day-by-day plan</span>
          <button type="button" onClick={addDay} className="text-xs font-medium text-brand hover:underline">
            + Add day
          </button>
        </div>
        <div className="mt-2 space-y-3">
          {itinerary.days.map((day, i) => (
            <div key={i} className="rounded-xl border border-line bg-canvas p-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">
                  {day.day}
                </span>
                <input
                  value={day.title}
                  onChange={(e) => updateDay(i, "title", e.target.value)}
                  placeholder="Day theme, e.g. Temple Hopping"
                  className="flex-1 rounded-lg border border-line bg-surface px-2 py-1.5 text-sm font-medium"
                />
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                <LabeledTextarea
                  label="Morning"
                  value={day.morning}
                  onChange={(v) => updateDay(i, "morning", v)}
                />
                <LabeledTextarea
                  label="Afternoon"
                  value={day.afternoon}
                  onChange={(v) => updateDay(i, "afternoon", v)}
                />
                <LabeledTextarea
                  label="Evening"
                  value={day.evening}
                  onChange={(v) => updateDay(i, "evening", v)}
                />
              </div>
              <div className="mt-2">
                <LabeledTextarea
                  label="Why this plan"
                  value={day.whyThisPlan}
                  onChange={(v) => updateDay(i, "whyThisPlan", v)}
                  rows={2}
                />
              </div>
              <button
                type="button"
                onClick={() => removeDay(i)}
                className="mt-2 text-xs font-medium text-red-600 hover:underline"
              >
                Remove day
              </button>
            </div>
          ))}
        </div>
      </div>

      <RepeatableRows
        label="Estimated budget"
        helpText="AI estimate shown to the customer — not verified pricing."
        items={itinerary.estimatedBudget}
        onChange={(v) => update("estimatedBudget", v as unknown as GeneratedItinerary["estimatedBudget"])}
        emptyItem={{ category: "", amount: "" }}
        fields={[
          { key: "category", label: "Category", placeholder: "Stay" },
          { key: "amount", label: "Amount", placeholder: "₹2,000 – ₹3,000" },
        ]}
      />

      <ListTextArea
        label="Packing checklist"
        items={itinerary.packingChecklist}
        onChange={(v) => update("packingChecklist", v)}
      />
      <ListTextArea
        label="Travel tips"
        items={itinerary.travelTips}
        onChange={(v) => update("travelTips", v)}
      />
      <ListTextArea
        label="Photography suggestions"
        items={itinerary.photographySuggestions}
        onChange={(v) => update("photographySuggestions", v)}
      />
    </div>
  );
}

function LabeledTextarea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full rounded-lg border border-line bg-surface px-2 py-1.5 text-sm"
      />
    </label>
  );
}
