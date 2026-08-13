const STATUS_LABELS: Record<string, string> = {
  awaiting_payment: "Awaiting payment",
  payment_successful: "Payment received",
  ai_processing: "Planning your trip",
  pending_review: "Under review",
  ready: "Ready",
  delivered: "Delivered",
};

const STATUS_STYLES: Record<string, string> = {
  awaiting_payment: "bg-gray-100 text-gray-600 border-gray-200",
  payment_successful: "bg-brand-light text-brand border-brand/30",
  ai_processing: "bg-suggested-bg text-suggested border-suggested-border",
  pending_review: "bg-warn-bg text-warn border-warn-border",
  ready: "bg-verified-bg text-verified border-verified-border",
  delivered: "bg-verified-bg text-verified border-verified-border",
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] || "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span className={`inline-block rounded-full border px-2.5 py-1 text-xs font-medium ${style}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}
