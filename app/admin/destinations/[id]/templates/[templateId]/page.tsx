"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AdminHeader } from "@/components/AdminHeader";
import { ItineraryEditor } from "@/components/admin/ItineraryEditor";
import { GeneratedItinerary } from "@/lib/types";

interface TemplateData {
  id: string;
  destinationId: string;
  days: number;
  budgetStyle: string;
  pace: string;
  status: "draft" | "approved";
  itinerary: GeneratedItinerary | null;
}

export default function TemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const destinationId = params.id as string;
  const templateId = params.templateId as string;

  const [template, setTemplate] = useState<TemplateData | null>(null);
  const [itinerary, setItinerary] = useState<GeneratedItinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  function load() {
    setLoading(true);
    fetch(`/api/admin/templates?destinationId=${destinationId}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((all: TemplateData[]) => {
        const found = all.find((t) => t.id === templateId);
        setTemplate(found ?? null);
        setItinerary(found?.itinerary ?? null);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, [destinationId, templateId]);

  async function handleSave() {
    if (!itinerary) return;
    setBusy("save");
    setError("");
    setSavedMsg("");
    try {
      const res = await fetch(`/api/admin/templates/${templateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itinerary }),
      });
      if (!res.ok) throw new Error("Could not save.");
      setSavedMsg("Saved as draft.");
      setTimeout(() => setSavedMsg(""), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  async function handleApprove() {
    if (!itinerary) return;
    setBusy("approve");
    setError("");
    try {
      const res = await fetch(`/api/admin/templates/${templateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", itinerary }),
      });
      if (!res.ok) throw new Error("Could not approve.");
      router.push(`/admin/destinations/${destinationId}/templates`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(null);
    }
  }

  async function handleRegenerate() {
    if (!template) return;
    setBusy("regenerate");
    setError("");
    try {
      const res = await fetch("/api/admin/templates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinationId,
          days: template.days,
          budgetStyle: template.budgetStyle,
          pace: template.pace,
        }),
      });
      if (!res.ok) throw new Error("Could not regenerate.");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <AdminHeader>
        <p className="text-sm text-muted">Loading…</p>
      </AdminHeader>
    );
  }

  if (!template) {
    return (
      <AdminHeader>
        <p className="text-sm text-red-600">Template not found.</p>
      </AdminHeader>
    );
  }

  return (
    <AdminHeader>
      <Link
        href={`/admin/destinations/${destinationId}/templates`}
        className="text-xs font-medium text-brand hover:underline"
      >
        ← Back to templates
      </Link>
      <h1 className="mt-2 font-display text-2xl font-semibold text-ink">
        {template.days} days · {template.budgetStyle} · {template.pace}
      </h1>
      <p className="mt-1 text-sm text-muted">
        This will be delivered instantly to any customer whose order matches this exact
        combination — review it as carefully as you would a real order.
      </p>

      {itinerary ? (
        <div className="mt-6">
          <ItineraryEditor itinerary={itinerary} onChange={setItinerary} />
        </div>
      ) : (
        <p className="mt-6 text-sm text-muted">No draft yet.</p>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {savedMsg && <p className="mt-4 text-sm text-verified">{savedMsg}</p>}

      <div className="mt-6 flex flex-wrap gap-3 pb-16">
        <button
          onClick={handleRegenerate}
          disabled={busy !== null}
          className="rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink hover:border-brand/40 disabled:opacity-60"
        >
          {busy === "regenerate" ? "Regenerating…" : "Regenerate from scratch"}
        </button>
        <button
          onClick={handleSave}
          disabled={busy !== null || !itinerary}
          className="rounded-full border border-brand px-5 py-2.5 text-sm font-medium text-brand hover:bg-brand-light disabled:opacity-60"
        >
          {busy === "save" ? "Saving…" : "Save draft"}
        </button>
        <button
          onClick={handleApprove}
          disabled={busy !== null || !itinerary}
          className="rounded-full bg-verified px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          {busy === "approve" ? "Approving…" : "Approve for instant delivery"}
        </button>
      </div>
    </AdminHeader>
  );
}
