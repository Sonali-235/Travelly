"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { BudgetStyle, Destination, TravelMode, TravelPace, TripRequest } from "@/lib/types";

const BUDGET_OPTIONS: { value: BudgetStyle; label: string }[] = [
  { value: "budget", label: "Budget" },
  { value: "mid-range", label: "Mid-range" },
  { value: "luxury", label: "Luxury" },
];

const PACE_OPTIONS: { value: TravelPace; label: string; hint: string }[] = [
  { value: "relaxed", label: "Relaxed", hint: "Fewer stops, more rest" },
  { value: "balanced", label: "Balanced", hint: "A good mix" },
  { value: "packed", label: "Packed", hint: "See as much as possible" },
];

const MODE_OPTIONS: { value: TravelMode; label: string }[] = [
  { value: "train", label: "Train" },
  { value: "bus", label: "Bus" },
  { value: "flight", label: "Flight" },
  { value: "car", label: "Car" },
  { value: "self-drive", label: "Self-drive" },
  { value: "bike", label: "Bike" },
];

export default function PlanPage() {
  const router = useRouter();
  const [destinationsList, setDestinationsList] = useState<Destination[]>([]);
  const [loadingDestinations, setLoadingDestinations] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState<TripRequest>({
    destinationId: "",
    departureCity: "",
    days: 3,
    startDate: "",
    adults: 2,
    children: 0,
    infants: 0,
    budgetStyle: "mid-range",
    pace: "balanced",
    travelMode: "train",
    mustVisit: "",
    placesToAvoid: "",
    additionalPreferences: "",
  });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/destinations")
      .then((res) => {
        if (!res.ok) throw new Error("Could not load destinations.");
        return res.json();
      })
      .then((data: Destination[]) => {
        if (cancelled) return;
        setDestinationsList(data);
        if (data.length > 0) {
          setForm((f) => ({ ...f, destinationId: data[0].id }));
        }
      })
      .catch((err) => !cancelled && setLoadError(err.message))
      .finally(() => !cancelled && setLoadingDestinations(false));
    return () => {
      cancelled = true;
    };
  }, []);

  function update<K extends keyof TripRequest>(key: K, value: TripRequest[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!form.destinationId) return;

    const today = new Date().toISOString().slice(0, 10);
    if (form.startDate < today) {
      setFormError("Start date can't be in the past — please pick today or a future date.");
      return;
    }
    if (!form.departureCity.trim()) {
      setFormError("Please enter a departure city.");
      return;
    }

    sessionStorage.setItem("travelly_trip_request", JSON.stringify(form));
    router.push("/checkout");
  }

  if (loadingDestinations) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-2xl px-5 py-24 text-center text-sm text-muted">
          Loading destinations…
        </main>
      </>
    );
  }

  if (loadError || destinationsList.length === 0) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-2xl px-5 py-24 text-center">
          <p className="font-display text-lg font-semibold text-ink">
            We couldn't load destinations
          </p>
          <p className="mt-2 text-sm text-muted">
            {loadError || "No destinations are set up yet — add one from the admin panel."}
          </p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-5 pb-24">
        <h1 className="mt-8 font-display text-2xl font-semibold text-ink">
          Tell us about your trip
        </h1>
        <p className="mt-1 text-sm text-muted">
          A few quick choices — the more you tell us, the better the plan.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          {/* Destination */}
          <Field label="Where do you want to go?">
            <select
              value={form.destinationId}
              onChange={(e) => update("destinationId", e.target.value)}
              className="input"
            >
              {destinationsList.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}, {d.state}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Departure city">
              <input
                required
                type="text"
                placeholder="e.g. Bhubaneswar"
                value={form.departureCity}
                onChange={(e) => update("departureCity", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Number of days">
              <input
                required
                type="number"
                min={1}
                max={14}
                value={form.days}
                onChange={(e) => update("days", Number(e.target.value))}
                className="input"
              />
            </Field>
          </div>

          <Field label="Start date">
            <input
              required
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              value={form.startDate}
              onChange={(e) => update("startDate", e.target.value)}
              className="input"
            />
          </Field>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Adults">
              <input
                type="number"
                min={1}
                value={form.adults}
                onChange={(e) => update("adults", Number(e.target.value))}
                className="input"
              />
            </Field>
            <Field label="Children">
              <input
                type="number"
                min={0}
                value={form.children}
                onChange={(e) => update("children", Number(e.target.value))}
                className="input"
              />
            </Field>
            <Field label="Infants">
              <input
                type="number"
                min={0}
                value={form.infants}
                onChange={(e) => update("infants", Number(e.target.value))}
                className="input"
              />
            </Field>
          </div>

          <Field label="Budget style">
            <CardRadio
              options={BUDGET_OPTIONS}
              value={form.budgetStyle}
              onChange={(v) => update("budgetStyle", v as BudgetStyle)}
            />
          </Field>

          <Field label="Travel pace">
            <div className="grid grid-cols-3 gap-2">
              {PACE_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => update("pace", opt.value)}
                  className={`rounded-xl2 border p-3 text-left transition ${
                    form.pace === opt.value
                      ? "border-brand bg-brand-light"
                      : "border-line bg-surface hover:border-brand/40"
                  }`}
                >
                  <p className="text-sm font-medium text-ink">{opt.label}</p>
                  <p className="mt-0.5 text-xs text-muted">{opt.hint}</p>
                </button>
              ))}
            </div>
          </Field>

          <Field label="Travel mode">
            <CardRadio
              options={MODE_OPTIONS}
              value={form.travelMode}
              onChange={(v) => update("travelMode", v as TravelMode)}
            />
          </Field>

          <Field label="Must-visit places (optional)">
            <input
              type="text"
              placeholder="e.g. Amber Fort"
              value={form.mustVisit}
              onChange={(e) => update("mustVisit", e.target.value)}
              className="input"
            />
          </Field>

          <Field label="Places to avoid (optional)">
            <input
              type="text"
              placeholder="e.g. crowded markets"
              value={form.placesToAvoid}
              onChange={(e) => update("placesToAvoid", e.target.value)}
              className="input"
            />
          </Field>

          <Field label="Anything else that would help us? (optional)">
            <textarea
              rows={4}
              placeholder={
                "Tell us anything important that will help us create a better trip.\n\nExamples:\n- I love photography.\n- Need less walking.\n- Travelling with parents.\n- Prefer sunrise locations.\n- Want peaceful places."
              }
              value={form.additionalPreferences}
              onChange={(e) => update("additionalPreferences", e.target.value)}
              className="input resize-none"
            />
          </Field>

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <button
            type="submit"
            className="w-full rounded-full bg-brand px-6 py-3 text-sm font-medium text-white shadow-soft transition hover:bg-brand-dark"
          >
            Continue to plan selection
          </button>
        </form>
      </main>
      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid #e5e7eb;
          background: white;
          padding: 0.65rem 0.85rem;
          font-size: 0.9rem;
          color: #111827;
        }
        .input:focus {
          outline: 2px solid #2563eb;
          outline-offset: 1px;
        }
      `}</style>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}

function CardRadio({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          type="button"
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
            value === opt.value
              ? "border-brand bg-brand-light text-brand"
              : "border-line bg-surface text-ink/70 hover:border-brand/40"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
