import type { Metadata } from "next";
import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { REAL_ORDER } from "@/lib/constants";
import OrderAlerts from "@/components/admin/OrderAlerts";
import AdminNav from "@/components/admin/AdminNav";
import LogoutButton from "@/components/LogoutButton";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false },
  // lets the owner add the admin panel to the phone's home screen as "Rafail Orders" (needed for alerts on iPhone)
  manifest: "/admin.webmanifest",
  appleWebApp: { capable: true, title: "Rafail Orders", statusBarStyle: "default" },
  icons: { apple: "/admin-icon-192.png" },
};
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // The login page is shown without the sidebar.
  if (!(await isAdmin())) return <>{children}</>;
  const newCount = await prisma.order.count({ where: { ...REAL_ORDER, seenAt: null } });
  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <span className="logo">
          <span className="logo-mark">R</span>
          <span>Rafail Natural<small>Admin panel</small></span>
        </span>
        <AdminNav newOrders={newCount} />
        <div className="bottom">
          <Link href="/" target="_blank">View store ↗</Link>
          <LogoutButton admin className="" />
        </div>
      </aside>
      <main className="admin-main">
        <OrderAlerts vapidKey={process.env.VAPID_PUBLIC_KEY || null} />
        {children}
      </main>
    </div>
  );
}
