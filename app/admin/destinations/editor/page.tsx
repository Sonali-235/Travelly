"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminHeader } from "@/components/AdminHeader";
import { Destination } from "@/lib/types";

const EMPTY_VERIFIED = {
  isSampleData: true,
  lastVerifiedOn: new Date().toISOString().slice(0, 10),
  hotels: [],
  restaurants: [],
  attractions: [],
  emergencyContacts: [],
  localFood: [],
  shopping: [],
  smartWarnings: [],
  transportTips: "",
};

const VERIFIED_HELP = `This box holds every fact-checked detail: hotels, restaurants,
attractions, emergency contacts, local food, shopping, warnings, and transport tips.
It must be valid JSON matching this shape:

{
  "isSampleData": false,
  "lastVerifiedOn": "2026-08-10",
  "hotels": [
    { "name": "...", "category": "budget", "pricePerNight": "₹...",
      "contact": "+91-...", "mapsQuery": "..." }
  ],
  "restaurants": [
    { "name": "...", "cuisine": "...", "priceRange": "...", "mapsQuery": "..." }
  ],
  "attractions": [
    { "name": "...", "entryFee": "₹...", "openingHours": "...",
      "mapsQuery": "...", "photographyAllowed": true }
  ],
  "emergencyContacts": [ { "label": "...", "number": "..." } ],
  "localFood": ["..."],
  "shopping": [ { "name": "...", "specialty": "..." } ],
  "smartWarnings": [ { "type": "...", "message": "..." } ],
  "permits": "optional text",
  "transportTips": "..."
}

Set "isSampleData" to false once every fact below is real — that's what
turns off the placeholder warning banner.`;

export default function EditorPage() {
  return (
    <Suspense fallback={<div />}>
      <EditorContent />
    </Suspense>
  );
}

function EditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingId = searchParams.get("id");
  const isNew = !editingId;

  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [state, setState] = useState("");
  const [tagline, setTagline] = useState("");
  const [bestSeason, setBestSeason] = useState("");
  const [accentEmoji, setAccentEmoji] = useState("📍");
  const [overview, setOverview] = useState("");
  const [verifiedText, setVerifiedText] = useState(JSON.stringify(EMPTY_VERIFIED, null, 2));
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isNew) return;
    fetch("/api/admin/destinations")
      .then((res) => res.json())
      .then((all: Destination[]) => {
        const found = all.find((d) => d.id === editingId);
        if (!found) {
          setError("Destination not found.");
          return;
        }
        setId(found.id);
        setName(found.name);
        setState(found.state);
        setTagline(found.tagline);
        setBestSeason(found.bestSeason);
        setAccentEmoji(found.accentEmoji);
        setOverview(found.overview);
        setVerifiedText(JSON.stringify(found.verified, null, 2));
      })
      .catch(() => setError("Could not load destination."))
      .finally(() => setLoading(false));
  }, [editingId, isNew]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    let verified;
    try {
      verified = JSON.parse(verifiedText);
    } catch {
      setError("The verified data box isn't valid JSON — check for a missing comma or bracket.");
      return;
    }

    if (!id || !name || !state) {
      setError("id, name, and state are required.");
      return;
    }

    setSaving(true);
    try {
      const destination: Destination = {
        id: id.trim().toLowerCase(),
        name,
        state,
        tagline,
        bestSeason,
        accentEmoji,
        overview,
        verified,
      };
      const res = await fetch("/api/admin/destinations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(destination),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Could not save.");
      }
      router.push("/admin/destinations");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <>
        <AdminHeader />
        <main className="mx-auto max-w-3xl px-5 py-10 text-sm text-muted">Loading…</main>
      </>
    );
  }

  return (
    <>
      <AdminHeader />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="font-display text-2xl font-semibold text-ink">
          {isNew ? "Add destination" : `Edit ${name || editingId}`}
        </h1>

        <form onSubmit={handleSave} className="mt-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="id (lowercase, no spaces — e.g. goa)"
              value={id}
              onChange={setId}
              disabled={!isNew}
            />
            <TextField label="Emoji" value={accentEmoji} onChange={setAccentEmoji} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <TextField label="Name" value={name} onChange={setName} />
            <TextField label="State" value={state} onChange={setState} />
          </div>
          <TextField label="Tagline" value={tagline} onChange={setTagline} />
          <TextField label="Best season" value={bestSeason} onChange={setBestSeason} />
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink">Overview</span>
            <textarea
              value={overview}
              onChange={(e) => setOverview(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-line px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink">
              Verified data (JSON)
            </span>
            <textarea
              value={verifiedText}
              onChange={(e) => setVerifiedText(e.target.value)}
              rows={20}
              spellCheck={false}
              className="w-full rounded-xl border border-line px-3 py-2 font-mono text-xs leading-relaxed"
            />
            <details className="mt-2">
              <summary className="cursor-pointer text-xs font-medium text-brand">
                What goes in here?
              </summary>
              <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-canvas p-3 text-xs text-muted">
                {VERIFIED_HELP}
              </pre>
            </details>
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save destination"}
          </button>
        </form>
      </main>
    </>
  );
}

function TextField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink">{label}</span>
      <input
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-line px-3 py-2 text-sm disabled:bg-canvas disabled:text-muted"
      />
    </label>
  );
}
