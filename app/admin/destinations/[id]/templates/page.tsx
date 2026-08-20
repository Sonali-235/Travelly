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
const TOTAL_COMBINATIONS = COMMON_DAYS.length * BUDGET_STYLES.length * PACES.length;

// Small gap between each generation call in the bulk run — Gemini's free
// tier has a requests-per-minute limit, and firing 36 calls back to back
// risks hitting it. This keeps the whole batch comfortably under it.
const BULK_GENERATE_DELAY_MS = 4000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function DestinationTemplatesPage() {
  const params = useParams();
  const destinationId = params.id as string;

  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    return fetch(`/api/admin/templates?destinationId=${destinationId}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data: TemplateRow[]) => {
        setTemplates(data);
        return data;
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [destinationId]);

  useEffect(() => {
    function refetch() {
      load();
    }
    window.addEventListener("focus", refetch);
    return () => window.removeEventListener("focus", refetch);
  }, [destinationId]);

  function findTemplate(days: number, budgetStyle: BudgetStyle, pace: TravelPace, list = templates) {
    return list.find((t) => t.days === days && t.budgetStyle === budgetStyle && t.pace === pace);
  }

  async function generateOne(days: number, budgetStyle: BudgetStyle, pace: TravelPace) {
    const res = await fetch("/api/admin/templates/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destinationId, days, budgetStyle, pace }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Failed for ${days}d/${budgetStyle}/${pace}`);
    }
  }

  async function handleGenerate(days: number, budgetStyle: BudgetStyle, pace: TravelPace) {
    const key = `${days}-${budgetStyle}-${pace}`;
    setGenerating(key);
    setError("");
    try {
      await generateOne(days, budgetStyle, pace);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setGenerating(null);
    }
  }

  async function handleGenerateAllMissing() {
    setError("");
    setBulkRunning(true);

    // Compute the missing list up front from the current data.
    const missing: { days: number; budgetStyle: BudgetStyle; pace: TravelPace }[] = [];
    for (const days of COMMON_DAYS) {
      for (const budgetStyle of BUDGET_STYLES) {
        for (const pace of PACES) {
          if (!findTemplate(days, budgetStyle, pace)) {
            missing.push({ days, budgetStyle, pace });
          }
        }
      }
    }

    setBulkProgress({ done: 0, total: missing.length });

    for (let i = 0; i < missing.length; i++) {
      const { days, budgetStyle, pace } = missing[i];
      try {
        await generateOne(days, budgetStyle, pace);
      } catch (err) {
        setError(
          `Stopped at ${days} days / ${budgetStyle} / ${pace}: ${
            err instanceof Error ? err.message : "unknown error"
          }. Already-generated ones are saved — you can resume by clicking this button again.`
        );
        break;
      }
      setBulkProgress({ done: i + 1, total: missing.length });
      await load();
      if (i < missing.length - 1) await sleep(BULK_GENERATE_DELAY_MS);
    }

    setBulkRunning(false);
  }

  const approvedCount = templates.filter((t) => t.status === "approved").length;
  const missingCount = TOTAL_COMBINATIONS - templates.length;

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
        gets delivered to the customer <strong>instantly</strong> — no AI wait. Customers can only
        pay for combinations that have an approved template — everything else is blocked before
        checkout, on purpose, so nobody ever waits.
      </p>
      <p className="mt-2 text-xs text-muted">
        {approvedCount} of {TOTAL_COMBINATIONS} combinations approved · {templates.length} of{" "}
        {TOTAL_COMBINATIONS} generated (as drafts or approved).
      </p>

      {!loading && approvedCount === 0 && (
        <div className="mt-4 rounded-xl2 border border-warn-border bg-warn-bg p-4">
          <p className="text-sm font-medium text-warn">
            ⚠ This destination isn't bookable yet
          </p>
          <p className="mt-1 text-xs text-ink/70">
            With zero approved combinations, every customer who tries to plan a trip here will be
            blocked at checkout — there's nothing to instantly deliver. Generate and approve at
            least one combination below before sharing this destination.
          </p>
        </div>
      )}

      {missingCount > 0 && (
        <div className="mt-4 rounded-xl2 border border-line bg-surface p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink">
                {missingCount} combination{missingCount > 1 ? "s" : ""} not generated yet
              </p>
              <p className="mt-0.5 text-xs text-muted">
                Generates every missing one as a draft, in one go — you still need to review and
                approve each before it's used for instant delivery. Takes roughly{" "}
                {Math.ceil((missingCount * (BULK_GENERATE_DELAY_MS + 3000)) / 1000 / 60)} minute
                {missingCount > 1 ? "s" : ""}, keep this tab open while it runs.
              </p>
            </div>
            <button
              onClick={handleGenerateAllMissing}
              disabled={bulkRunning}
              className="shrink-0 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
            >
              {bulkRunning
                ? `Generating ${bulkProgress.done}/${bulkProgress.total}…`
                : "Generate all missing"}
            </button>
          </div>
        </div>
      )}

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
                              disabled={isGenerating || bulkRunning}
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
