"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STATUSES, PAYMENT_LABELS, PAYMENT_STATUSES, STATUS_LABELS } from "@/lib/constants";

type Props = {
  order: { id: number; status: string; paymentStatus: string; paymentMethod: string; courier: string; trackingNumber: string };
};

export default function OrderStatusForm({ order }: Props) {
  const router = useRouter();
  const [form, setForm] = useState(order);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const cancelled = order.status === "CANCELLED";

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (form.status === "CANCELLED" && !cancelled && !confirm("Cancel this order? Stock will be added back. The customer will be emailed.")) return;
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/admin/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    setMsg(res.ok ? { ok: true, text: "Saved" } : { ok: false, text: data.error || "Could not save" });
    router.refresh();
  }

  return (
    <form className="card stack" onSubmit={save}>
      <h3 style={{ margin: 0 }}>Update order</h3>
      <div className="field">
        <label>Order status</label>
        <select className="select" value={form.status} disabled={cancelled} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <span className="hint">The customer is emailed when you mark it Shipped, Delivered or Cancelled.</span>
      </div>
      {(form.status === "SHIPPED" || form.status === "DELIVERED" || order.trackingNumber) && (
        <>
          <div className="field">
            <label>Courier</label>
            <input className="input" value={form.courier} placeholder="e.g. India Post, Delhivery, DTDC" onChange={(e) => setForm({ ...form, courier: e.target.value })} />
          </div>
          <div className="field">
            <label>Tracking number</label>
            <input className="input" value={form.trackingNumber} onChange={(e) => setForm({ ...form, trackingNumber: e.target.value })} />
          </div>
        </>
      )}
      <div className="field">
        <label>Payment status</label>
        <select className="select" value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}>
          {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{PAYMENT_LABELS[s]}</option>)}
        </select>
        {order.paymentMethod === "COD" && <span className="hint">For COD, mark as Paid once you receive the cash.</span>}
        {order.paymentMethod === "UPI" && <span className="hint">Check the SBI / YONO app for this payment (match the amount and the customer&apos;s UPI reference), then mark as Paid. The order is confirmed automatically.</span>}
        {order.paymentMethod === "ONLINE" && <span className="hint">Refunds are made from the Razorpay dashboard. Mark as Refunded here afterwards.</span>}
      </div>
      {msg && <p className={`alert small ${msg.ok ? "alert-success" : "alert-error"}`}>{msg.text}</p>}
      <button className="btn btn-primary btn-block" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
    </form>
  );
}
