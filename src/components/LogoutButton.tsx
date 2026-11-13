"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton({ admin = false, className = "btn btn-outline btn-sm" }: { admin?: boolean; className?: string }) {
  const router = useRouter();
  return (
    <button
      className={className}
      onClick={async () => {
        await fetch(admin ? "/api/admin/logout" : "/api/auth/logout", { method: "POST" });
        router.push(admin ? "/admin/login" : "/");
        router.refresh();
      }}
    >
      Log out
    </button>
  );
}
