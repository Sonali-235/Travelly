const STATUS_LABELS: Record<string, string> = {
  under_review: "Under review",
  ready: "Ready",
  regenerating: "Regenerating",
  delivered: "Delivered",
};

const STATUS_STYLES: Record<string, string> = {
  under_review: "bg-suggested-bg text-suggested border-suggested-border",
  ready: "bg-verified-bg text-verified border-verified-border",
  regenerating: "bg-warn-bg text-warn border-warn-border",
  delivered: "bg-brand-light text-brand border-brand/30",
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] || "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span className={`inline-block rounded-full border px-2.5 py-1 text-xs font-medium ${style}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}
