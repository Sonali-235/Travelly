"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminHeader } from "@/components/AdminHeader";
import { ListTextArea, RepeatableRows } from "@/components/admin/RepeatableFields";
import { Destination } from "@/lib/types";

const EMPTY_VERIFIED = {
  isSampleData: true,
  lastVerifiedOn: new Date().toISOString().slice(0, 10),
  hotels: [] as Record<string, unknown>[],
  restaurants: [] as Record<string, unknown>[],
  attractions: [] as Record<string, unknown>[],
  emergencyContacts: [] as Record<string, unknown>[],
  localFood: [] as string[],
  shopping: [] as Record<string, unknown>[],
  smartWarnings: [] as Record<string, unknown>[],
  permits: "",
  transportTips: "",
};

type VerifiedState = typeof EMPTY_VERIFIED;

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
  const [verified, setVerified] = useState<VerifiedState>(EMPTY_VERIFIED);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

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
        setVerified({ ...EMPTY_VERIFIED, ...found.verified } as unknown as VerifiedState);
      })
      .catch(() => setError("Could not load destination."))
      .finally(() => setLoading(false));
  }, [editingId, isNew]);

  function updateVerified<K extends keyof VerifiedState>(key: K, value: VerifiedState[K]) {
    setVerified((v) => ({ ...v, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSavedMsg("");

    if (!id || !name || !state) {
      setError("id, name, and state are required.");
      return;
    }
    if (!/^[a-z0-9-]+$/.test(id)) {
      setError("id must be lowercase letters, numbers, and hyphens only (e.g. 'goa').");
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
        verified: verified as unknown as Destination["verified"],
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
      setSavedMsg("Saved!");
      setTimeout(() => router.push("/admin/destinations"), 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminHeader>
        <p className="text-sm text-muted">Loading…</p>
      </AdminHeader>
    );
  }

  return (
    <AdminHeader>
      <div className="pb-24">
        <h1 className="font-display text-2xl font-semibold text-ink">
          {isNew ? "Add destination" : `Edit ${name || editingId}`}
        </h1>

        <form onSubmit={handleSave} className="mt-6 space-y-8">
          {/* Basics */}
          <section className="space-y-4 rounded-xl2 border border-line bg-surface p-4 shadow-soft">
            <h2 className="text-sm font-semibold text-ink">Basics</h2>
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
          </section>

          {/* Verification status */}
          <section className="space-y-3 rounded-xl2 border border-warn-border bg-warn-bg p-4">
            <h2 className="text-sm font-semibold text-warn">Verification status</h2>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={verified.isSampleData}
                onChange={(e) => updateVerified("isSampleData", e.target.checked)}
              />
              This still contains placeholder / unverified data
            </label>
            <label className="block max-w-xs">
              <span className="mb-1 block text-xs text-muted">Last verified on</span>
              <input
                type="date"
                value={verified.lastVerifiedOn}
                onChange={(e) => updateVerified("lastVerifiedOn", e.target.value)}
                className="w-full rounded-xl border border-line px-3 py-2 text-sm"
              />
            </label>
          </section>

          {/* Hotels */}
          <section className="rounded-xl2 border border-line bg-surface p-4 shadow-soft">
            <RepeatableRows
              label="Hotels"
              items={verified.hotels}
              onChange={(v) => updateVerified("hotels", v)}
              emptyItem={{ name: "", category: "mid-range", pricePerNight: "", contact: "", mapsQuery: "" }}
              fields={[
                { key: "name", label: "Name", wide: true },
                { key: "category", label: "Category", type: "select", options: ["budget", "mid-range", "luxury"] },
                { key: "pricePerNight", label: "Price / night", placeholder: "₹3,500 – ₹5,500" },
                { key: "contact", label: "Contact", placeholder: "+91-..." },
                { key: "mapsQuery", label: "Maps search text", placeholder: "Hotel name + city" },
              ]}
            />
          </section>

          {/* Restaurants */}
          <section className="rounded-xl2 border border-line bg-surface p-4 shadow-soft">
            <RepeatableRows
              label="Restaurants"
              items={verified.restaurants}
              onChange={(v) => updateVerified("restaurants", v)}
              emptyItem={{ name: "", cuisine: "", priceRange: "", mapsQuery: "" }}
              fields={[
                { key: "name", label: "Name", wide: true },
                { key: "cuisine", label: "Cuisine" },
                { key: "priceRange", label: "Price range", placeholder: "₹300 – ₹500 for two" },
                { key: "mapsQuery", label: "Maps search text" },
              ]}
            />
          </section>

          {/* Attractions */}
          <section className="rounded-xl2 border border-line bg-surface p-4 shadow-soft">
            <RepeatableRows
              label="Attractions & entry fees"
              items={verified.attractions}
              onChange={(v) => updateVerified("attractions", v)}
              emptyItem={{
                name: "",
                entryFee: "",
                openingHours: "",
                mapsQuery: "",
                photographyAllowed: true,
                notes: "",
              }}
              fields={[
                { key: "name", label: "Name", wide: true },
                { key: "entryFee", label: "Entry fee", placeholder: "₹50 or Free" },
                { key: "openingHours", label: "Opening hours" },
                { key: "mapsQuery", label: "Maps search text" },
                { key: "photographyAllowed", label: "Photography allowed", type: "checkbox" },
                { key: "notes", label: "Notes", wide: true },
              ]}
            />
          </section>

          {/* Emergency contacts */}
          <section className="rounded-xl2 border border-line bg-surface p-4 shadow-soft">
            <RepeatableRows
              label="Emergency contacts"
              items={verified.emergencyContacts}
              onChange={(v) => updateVerified("emergencyContacts", v)}
              emptyItem={{ label: "", number: "" }}
              fields={[
                { key: "label", label: "Label", placeholder: "Tourist Police Helpline" },
                { key: "number", label: "Number" },
              ]}
            />
          </section>

          {/* Shopping */}
          <section className="rounded-xl2 border border-line bg-surface p-4 shadow-soft">
            <RepeatableRows
              label="Shopping spots"
              items={verified.shopping}
              onChange={(v) => updateVerified("shopping", v)}
              emptyItem={{ name: "", specialty: "" }}
              fields={[
                { key: "name", label: "Name" },
                { key: "specialty", label: "Specialty" },
              ]}
            />
          </section>

          {/* Smart warnings */}
          <section className="rounded-xl2 border border-line bg-surface p-4 shadow-soft">
            <RepeatableRows
              label="Smart warnings"
              items={verified.smartWarnings}
              onChange={(v) => updateVerified("smartWarnings", v)}
              emptyItem={{ type: "", message: "" }}
              fields={[
                { key: "type", label: "Type", placeholder: "Heat Wave" },
                { key: "message", label: "Message", wide: true },
              ]}
            />
          </section>

          {/* Local food + permits + transport */}
          <section className="space-y-4 rounded-xl2 border border-line bg-surface p-4 shadow-soft">
            <ListTextArea
              label="Local food"
              items={verified.localFood}
              onChange={(v) => updateVerified("localFood", v)}
            />
            <TextField
              label="Permits (optional)"
              value={verified.permits}
              onChange={(v) => updateVerified("permits", v)}
            />
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink">Transport tips</span>
              <textarea
                value={verified.transportTips}
                onChange={(e) => updateVerified("transportTips", e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-line px-3 py-2 text-sm"
              />
            </label>
          </section>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {savedMsg && <p className="text-sm text-verified">{savedMsg}</p>}

          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save destination"}
          </button>
        </form>
      </div>
    </AdminHeader>
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
