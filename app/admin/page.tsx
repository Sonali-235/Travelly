import Link from "next/link";
import { AdminHeader } from "@/components/AdminHeader";
import { listDestinations } from "@/lib/destinations-db";
import { listAllOrders } from "@/lib/orders-db";
import { getApprovedTemplateCounts } from "@/lib/templates-db";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [destinations, orders, templateCounts] = await Promise.all([
    listDestinations(),
    listAllOrders(),
    getApprovedTemplateCounts(),
  ]);

  const sampleDataCount = destinations.filter((d) => d.verified.isSampleData).length;
  const notBookableCount = destinations.filter((d) => !templateCounts[d.id]).length;
  const readyOrders = orders.filter((o) => o.status === "ready" || o.status === "delivered").length;
  // Every order in this table exists only because payment succeeded — there's
  // no "awaiting payment" state anymore, so no filtering needed here.
  const totalRevenue = orders.reduce((sum, o) => sum + (o.plan === "plus" ? 99 : 49), 0);

  return (
    <AdminHeader>
      <h1 className="font-display text-2xl font-semibold text-ink">Dashboard</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Destinations" value={destinations.length} />
        <StatCard label="Total orders" value={orders.length} />
        <StatCard label="Completed itineraries" value={readyOrders} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <StatCard label="Revenue collected (est.)" value={`₹${totalRevenue}`} />
        <StatCard
          label="Destinations still using placeholder data"
          value={sampleDataCount}
          warn={sampleDataCount > 0}
        />
        <StatCard
          label="Destinations not bookable yet"
          value={notBookableCount}
          warn={notBookableCount > 0}
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

      {notBookableCount > 0 && (
        <div className="mt-3 rounded-xl2 border border-warn-border bg-warn-bg p-4 text-sm text-warn">
          {notBookableCount} destination{notBookableCount > 1 ? "s have" : " has"} zero approved
          trip combinations — customers can't book {notBookableCount > 1 ? "them" : "it"} at all
          until you generate and approve at least one in{" "}
          <Link href="/admin/destinations" className="font-medium underline">
            Destinations → Templates
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
