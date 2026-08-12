import Link from "next/link";
import { AdminHeader } from "@/components/AdminHeader";
import { listDestinations } from "@/lib/destinations-db";
import { listAllOrders } from "@/lib/orders-db";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [destinations, orders] = await Promise.all([listDestinations(), listAllOrders()]);

  const sampleDataCount = destinations.filter((d) => d.verified.isSampleData).length;
  const readyOrders = orders.filter((o) => o.status === "ready" || o.status === "delivered").length;
  const totalRevenue = orders
    .filter((o) => o.status !== "awaiting_payment")
    .reduce((sum, o) => sum + (o.plan === "plus" ? 99 : 49), 0);

  return (
    <AdminHeader>
      <h1 className="font-display text-2xl font-semibold text-ink">Dashboard</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Destinations" value={destinations.length} />
        <StatCard label="Total orders" value={orders.length} />
        <StatCard label="Completed itineraries" value={readyOrders} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <StatCard label="Revenue collected (est.)" value={`₹${totalRevenue}`} />
        <StatCard
          label="Destinations still using placeholder data"
          value={sampleDataCount}
          warn={sampleDataCount > 0}
        />
      </div>

      {sampleDataCount > 0 && (
        <div className="mt-6 rounded-xl2 border border-warn-border bg-warn-bg p-4 text-sm text-warn">
          {sampleDataCount} destination{sampleDataCount > 1 ? "s" : ""} still{" "}
          {sampleDataCount > 1 ? "have" : "has"} placeholder verified data. Real customers
          shouldn't see these yet —{" "}
          <Link href="/admin/destinations" className="font-medium underline">
            fix them in Destinations
          </Link>
          .
        </div>
      )}

      <div className="mt-8 flex gap-3">
        <Link
          href="/admin/destinations"
          className="rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark"
        >
          Manage destinations
        </Link>
        <Link
          href="/admin/orders"
          className="rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink hover:border-brand/40"
        >
          View orders
        </Link>
      </div>
    </AdminHeader>
  );
}

function StatCard({
  label,
  value,
  warn,
}: {
  label: string;
  value: string | number;
  warn?: boolean;
}) {
  return (
    <div
      className={`rounded-xl2 border p-4 shadow-soft ${
        warn ? "border-warn-border bg-warn-bg" : "border-line bg-surface"
      }`}
    >
      <p className={`text-2xl font-semibold ${warn ? "text-warn" : "text-ink"}`}>{value}</p>
      <p className="mt-1 text-xs text-muted">{label}</p>
    </div>
  );
}
