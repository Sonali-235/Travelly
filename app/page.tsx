import Link from "next/link";
import { Header } from "@/components/Header";
import { listDestinations } from "@/lib/destinations-db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const destinations = await listDestinations();
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-5 pb-24">
        <section className="pt-14 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-brand">
            India domestic travel
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">
            A trip plan you can actually trust.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-ink/70">
            AI plans the day-by-day flow. A real person verifies every hotel,
            fee, and phone number before it reaches you. No guessed facts —
            ever.
          </p>
          <Link
            href="/plan"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-medium text-white shadow-soft transition hover:bg-brand-dark"
          >
            Plan your trip
          </Link>
        </section>

        <section className="mt-20">
          <h2 className="font-display text-lg font-semibold text-ink">
            Currently covering
          </h2>
          <p className="mt-1 text-sm text-muted">
            We launch with a small set of destinations we've personally
            verified — more added regularly.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {destinations.map((d) => (
              <div
                key={d.id}
                className="rounded-xl2 border border-line bg-surface p-5 shadow-soft"
              >
                <div className="text-2xl">{d.accentEmoji}</div>
                <h3 className="mt-2 font-display text-base font-semibold text-ink">
                  {d.name}, {d.state}
                </h3>
                <p className="mt-1 text-sm text-ink/70">{d.tagline}</p>
                <p className="mt-2 text-xs text-muted">Best: {d.bestSeason}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20 grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl2 border border-line bg-surface p-5">
            <h3 className="font-display text-base font-semibold text-ink">
              Explorer — ₹49
            </h3>
            <p className="mt-1 text-sm text-ink/70">
              Day-wise itinerary, budget estimate, packing checklist, travel
              tips. Delivered within 30 minutes.
            </p>
          </div>
          <div className="rounded-xl2 border border-brand/40 bg-brand-light p-5">
            <h3 className="font-display text-base font-semibold text-ink">
              Travelly Plus — ₹99
            </h3>
            <p className="mt-1 text-sm text-ink/70">
              Everything in Explorer, plus verified hotels, entry fees,
              emergency contacts, and smart warnings. Delivered within 1 hour.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
