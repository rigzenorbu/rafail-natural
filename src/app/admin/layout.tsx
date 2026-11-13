import type { Metadata } from "next";
import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import AdminNav from "@/components/admin/AdminNav";
import LogoutButton from "@/components/LogoutButton";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // The login page is shown without the sidebar.
  if (!(await isAdmin())) return <>{children}</>;
  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <span className="logo">
          <span className="logo-mark">R</span>
          <span>Rafail Natural<small>Admin panel</small></span>
        </span>
        <AdminNav />
        <div className="bottom">
          <Link href="/" target="_blank">View store ↗</Link>
          <LogoutButton admin className="" />
        </div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
