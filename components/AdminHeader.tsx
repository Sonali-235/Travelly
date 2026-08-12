"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: GridIcon },
  { href: "/admin/destinations", label: "Destinations", icon: MapIcon },
  { href: "/admin/orders", label: "Orders", icon: ReceiptIcon },
];

export function AdminHeader({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-canvas md:flex">
      <aside className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 md:fixed md:inset-y-0 md:left-0 md:w-56 md:flex-col md:items-stretch md:justify-start md:border-b-0 md:border-r md:px-4 md:py-6">
        <span className="font-display text-lg font-semibold text-ink">Travelly Admin</span>

        <nav className="flex items-center gap-1 md:mt-8 md:flex-col md:items-stretch md:gap-1">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active ? "bg-brand-light text-brand" : "text-muted hover:bg-canvas hover:text-ink"
                }`}
              >
                <Icon />
                <span className="hidden md:inline">{l.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:mt-auto md:block md:border-t md:border-line md:pt-4">
          <button onClick={handleLogout} className="text-xs font-medium text-muted hover:text-brand">
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 md:ml-56">
        <div className="mx-auto max-w-4xl px-5 py-10">{children}</div>
      </main>
    </div>
  );
}

function GridIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 4l-6 2v14l6-2 6 2 6-2V4l-6 2-6-2z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M9 4v14M15 6v14" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function ReceiptIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M9 8h6M9 12h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
