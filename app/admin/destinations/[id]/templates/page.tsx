"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AdminHeader } from "@/components/AdminHeader";
import { BudgetStyle, TravelPace } from "@/lib/types";

interface TemplateRow {
  id: string;
  days: number;
  budgetStyle: BudgetStyle;
  pace: TravelPace;
  status: "draft" | "approved";
  itinerary: unknown;
}

const COMMON_DAYS = [3, 5, 7, 9];
const BUDGET_STYLES: BudgetStyle[] = ["budget", "mid-range", "luxury"];
const PACES: TravelPace[] = ["relaxed", "balanced", "packed"];

export default function DestinationTemplatesPage() {
  const params = useParams();
  const destinationId = params.id as string;

  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    fetch(`/api/admin/templates?destinationId=${destinationId}`, { cache: "no-store" })
      .then((res) => res.json())
      .then(setTemplates)
      .finally(() => setLoading(false));
  }

  useEffect(load, [destinationId]);

  function findTemplate(days: number, budgetStyle: BudgetStyle, pace: TravelPace) {
    return templates.find((t) => t.days === days && t.budgetStyle === budgetStyle && t.pace === pace);
  }

  async function handleGenerate(days: number, budgetStyle: BudgetStyle, pace: TravelPace) {
    const key = `${days}-${budgetStyle}-${pace}`;
    setGenerating(key);
    setError("");
    try {
      const res = await fetch("/api/admin/templates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destinationId, days, budgetStyle, pace }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Could not generate.");
      }
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setGenerating(null);
    }
  }

  const approvedCount = templates.filter((t) => t.status === "approved").length;

  return (
    <AdminHeader>
      <Link href="/admin/destinations" className="text-xs font-medium text-brand hover:underline">
        ← Back to destinations
      </Link>
      <h1 className="mt-2 font-display text-2xl font-semibold text-ink">
        Pre-generated itineraries — {destinationId}
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Approve a combination here and any order matching that exact days + budget style + pace
        gets delivered to the customer <strong>instantly</strong> — no AI wait, no per-order
        review. Orders for combinations without an approved template still go through the normal
        live-generation and review flow.
      </p>
      <p className="mt-2 text-xs text-muted">
        {approvedCount} of {COMMON_DAYS.length * BUDGET_STYLES.length * PACES.length} common
        combinations approved.
      </p>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {loading && <p className="mt-6 text-sm text-muted">Loading…</p>}

      {!loading && (
        <div className="mt-6 space-y-8">
          {COMMON_DAYS.map((days) => (
            <div key={days}>
              <h2 className="text-sm font-semibold text-ink">{days} days</h2>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {BUDGET_STYLES.map((budgetStyle) =>
                  PACES.map((pace) => {
                    const t = findTemplate(days, budgetStyle, pace);
                    const key = `${days}-${budgetStyle}-${pace}`;
                    const isGenerating = generating === key;
                    return (
                      <div
                        key={key}
                        className={`rounded-xl border p-3 text-xs ${
                          t?.status === "approved"
                            ? "border-verified-border bg-verified-bg"
                            : t
                            ? "border-warn-border bg-warn-bg"
                            : "border-line bg-surface"
                        }`}
                      >
                        <p className="font-medium text-ink">
                          {budgetStyle} · {pace}
                        </p>
                        <p className="mt-0.5 text-muted">
                          {t?.status === "approved"
                            ? "Approved"
                            : t
                            ? "Draft — needs review"
                            : "Not generated"}
                        </p>
                        <div className="mt-2 flex gap-2">
                          {!t && (
                            <button
                              onClick={() => handleGenerate(days, budgetStyle, pace)}
                              disabled={isGenerating}
                              className="rounded-full bg-brand px-3 py-1 text-white disabled:opacity-60"
                            >
                              {isGenerating ? "Generating…" : "Generate"}
                            </button>
                          )}
                          {t && (
                            <Link
                              href={`/admin/destinations/${destinationId}/templates/${t.id}`}
                              className="rounded-full border border-line px-3 py-1 text-ink hover:border-brand/40"
                            >
                              {t.status === "approved" ? "View/edit" : "Review"}
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminHeader>
  );
}
