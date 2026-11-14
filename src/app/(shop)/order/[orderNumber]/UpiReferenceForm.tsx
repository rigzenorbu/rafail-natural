"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UpiReferenceForm({ orderNumber, token, saved }: { orderNumber: string; token: string; saved: string }) {
  const router = useRouter();
  const [reference, setReference] = useState(saved);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/orders/reference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, token, reference }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not save");
      setMsg({ ok: true, text: "Thank you. We will confirm your order as soon as we see the payment." });
      router.refresh();
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="upi-ref" onSubmit={submit}>
      <label htmlFor="upi-ref">UPI reference (UTR) number shown in your payment app after paying</label>
      <div className="row">
        <input id="upi-ref" className="input" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. 431276540912" inputMode="text" autoComplete="off" required />
        <button className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
      </div>
      {msg && <p className={`alert small ${msg.ok ? "alert-success" : "alert-error"}`} style={{ marginTop: 10, marginBottom: 0 }}>{msg.text}</p>}
    </form>
  );
}
