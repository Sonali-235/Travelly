import { Destination, GeneratedItinerary, PlanTier } from "@/lib/types";
import { AiSuggestedBadge, SmartWarningBadge, VerifiedBadge } from "./Badges";

function mapsUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function ItineraryDisplay({
  destination,
  itinerary,
  plan,
  travelerName,
}: {
  destination: Destination;
  itinerary: GeneratedItinerary;
  plan: PlanTier;
  travelerName: string;
}) {
  const showVerifiedExtras = plan === "plus";

  return (
    <div className="space-y-10">
      {/* Overview */}
      <section>
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          {destination.name}, {destination.state} · for {travelerName}
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-ink">
          Your trip overview
        </h1>
        <div className="mt-3 flex items-center gap-2">
          <AiSuggestedBadge />
        </div>
        <p className="mt-2 text-ink/80">{itinerary.tripOverview}</p>
      </section>

      {/* Smart warnings - Plus only, verified */}
      {showVerifiedExtras && destination.verified.smartWarnings.length > 0 && (
        <section>
          <div className="mb-2 flex items-center gap-2">
            <h2 className="font-display text-lg font-semibold text-ink">Smart warnings</h2>
            <VerifiedBadge />
          </div>
          <div className="space-y-2">
            {destination.verified.smartWarnings.map((w) => (
              <SmartWarningBadge key={w.type}>
                <strong className="font-medium">{w.type}:</strong> {w.message}
              </SmartWarningBadge>
            ))}
          </div>
        </section>
      )}

      {/* Day by day timeline - the signature element */}
      <section>
        <h2 className="mb-4 font-display text-lg font-semibold text-ink">Day-by-day plan</h2>
        <ol className="relative space-y-8 border-l border-line pl-6">
          {itinerary.days.map((d) => (
            <li key={d.day} className="relative">
              <span className="absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">
                {d.day}
              </span>
              <h3 className="font-display text-base font-semibold text-ink">{d.title}</h3>
              <div className="mt-2 space-y-2 text-sm">
                <TimeBlock label="Morning" icon="sunrise" text={d.morning} />
                <TimeBlock label="Afternoon" icon="sun" text={d.afternoon} />
                <TimeBlock label="Evening" icon="sunset" text={d.evening} />
              </div>
              <p className="mt-2 rounded-lg bg-suggested-bg px-3 py-2 text-xs text-suggested">
                <strong className="font-medium">Why this plan:</strong> {d.whyThisPlan}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* Verified hotels & restaurants - Plus only */}
      {showVerifiedExtras && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="font-display text-lg font-semibold text-ink">Verified stays</h2>
            <VerifiedBadge />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {destination.verified.hotels.map((h) => (
              <div key={h.name} className="rounded-xl2 border border-line bg-surface p-4 shadow-soft">
                <p className="text-xs uppercase tracking-wide text-muted">{h.category}</p>
                <p className="mt-1 font-medium text-ink">{h.name}</p>
                <p className="mt-1 text-sm text-ink/70">{h.pricePerNight}</p>
                <p className="mt-1 text-xs text-muted">{h.contact}</p>
                <a
                  href={mapsUrl(h.mapsQuery)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-xs font-medium text-brand hover:underline"
                >
                  View on Google Maps →
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {showVerifiedExtras && destination.verified.restaurants.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="font-display text-lg font-semibold text-ink">Verified restaurants</h2>
            <VerifiedBadge />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {destination.verified.restaurants.map((r) => (
              <div key={r.name} className="rounded-xl2 border border-line bg-surface p-4 shadow-soft">
                <p className="font-medium text-ink">{r.name}</p>
                <p className="mt-1 text-sm text-ink/70">
                  {r.cuisine} · {r.priceRange}
                </p>
                <a
                  href={mapsUrl(r.mapsQuery)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-xs font-medium text-brand hover:underline"
                >
                  View on Google Maps →
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {showVerifiedExtras && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="font-display text-lg font-semibold text-ink">Verified attractions & entry fees</h2>
            <VerifiedBadge />
          </div>
          <div className="space-y-2">
            {destination.verified.attractions.map((a) => (
              <div
                key={a.name}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-surface px-4 py-3"
              >
                <div>
                  <p className="font-medium text-ink">{a.name}</p>
                  <p className="text-xs text-muted">{a.openingHours}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-verified">{a.entryFee}</span>
                  <a
                    href={mapsUrl(a.mapsQuery)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-brand hover:underline"
                  >
                    Maps →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {showVerifiedExtras && (
        <section className="grid gap-8 sm:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <h2 className="font-display text-base font-semibold text-ink">Emergency contacts</h2>
              <VerifiedBadge />
            </div>
            <ul className="space-y-1 text-sm text-ink/80">
              {destination.verified.emergencyContacts.map((c) => (
                <li key={c.label} className="flex justify-between">
                  <span>{c.label}</span>
                  <span className="font-medium">{c.number}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="mb-2 flex items-center gap-2">
              <h2 className="font-display text-base font-semibold text-ink">Local food to try</h2>
              <VerifiedBadge />
            </div>
            <ul className="flex flex-wrap gap-2">
              {destination.verified.localFood.map((f) => (
                <li key={f} className="rounded-full bg-verified-bg px-3 py-1 text-xs text-verified">
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {showVerifiedExtras && destination.verified.shopping.length > 0 && (
        <section>
          <div className="mb-2 flex items-center gap-2">
            <h2 className="font-display text-base font-semibold text-ink">Shopping</h2>
            <VerifiedBadge />
          </div>
          <ul className="space-y-1 text-sm text-ink/80">
            {destination.verified.shopping.map((s) => (
              <li key={s.name} className="flex justify-between">
                <span>{s.name}</span>
                <span className="text-muted">{s.specialty}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Budget, packing, tips - AI suggested, available on both plans */}
      <section className="grid gap-8 sm:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <h2 className="font-display text-base font-semibold text-ink">Estimated budget</h2>
            <AiSuggestedBadge />
          </div>
          <ul className="space-y-1 text-sm text-ink/80">
            {itinerary.estimatedBudget.map((b) => (
              <li key={b.category} className="flex justify-between">
                <span>{b.category}</span>
                <span className="font-medium">{b.amount}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="mb-2 flex items-center gap-2">
            <h2 className="font-display text-base font-semibold text-ink">Packing checklist</h2>
            <AiSuggestedBadge />
          </div>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-ink/80">
            {itinerary.packingChecklist.map((item) => (
              <li key={item}>· {item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center gap-2">
          <h2 className="font-display text-base font-semibold text-ink">Travel tips</h2>
          <AiSuggestedBadge />
        </div>
        <ul className="space-y-1 text-sm text-ink/80">
          {itinerary.travelTips.map((t) => (
            <li key={t}>· {t}</li>
          ))}
        </ul>
      </section>

      {itinerary.photographySuggestions.length > 0 && (
        <section>
          <div className="mb-2 flex items-center gap-2">
            <h2 className="font-display text-base font-semibold text-ink">Photography spots</h2>
            <AiSuggestedBadge />
          </div>
          <ul className="space-y-1 text-sm text-ink/80">
            {itinerary.photographySuggestions.map((p) => (
              <li key={p}>· {p}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function TimeBlock({
  label,
  text,
}: {
  label: string;
  icon: "sunrise" | "sun" | "sunset";
  text: string;
}) {
  return (
    <div className="flex gap-2">
      <span className="w-16 shrink-0 text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </span>
      <p className="text-ink/80">{text}</p>
    </div>
  );
}
