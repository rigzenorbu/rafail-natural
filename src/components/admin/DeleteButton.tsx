"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteButton({ url, confirmText, label = "Delete", redirectTo }: { url: string; confirmText: string; label?: string; redirectTo?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-danger btn-sm"
      disabled={busy}
      onClick={async () => {
        if (!confirm(confirmText)) return;
        setBusy(true);
        const res = await fetch(url, { method: "DELETE" });
        setBusy(false);
        if (!res.ok) return alert((await res.json().catch(() => ({}))).error || "Could not delete");
        if (redirectTo) router.push(redirectTo);
        router.refresh();
      }}
    >
      {busy ? "…" : label}
    </button>
  );
}
