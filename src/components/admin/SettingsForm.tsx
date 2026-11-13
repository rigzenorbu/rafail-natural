"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Settings = {
  shippingFee: number;
  freeShippingAbove: number;
  codEnabled: boolean;
  codFee: number;
  storePhone: string;
  storeEmail: string;
  storeAddress: string;
  announcement: string;
};

export default function SettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [form, setForm] = useState(settings);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const text = (k: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setBusy(false);
    setMsg(res.ok ? { ok: true, text: "Settings saved" } : { ok: false, text: "Could not save settings" });
    router.refresh();
  }

  return (
    <form onSubmit={save} style={{ maxWidth: 760 }}>
      <section className="form-section">
        <h3>Shipping &amp; payment</h3>
        <p className="hint">Orders at or above the free-shipping amount (after discount) ship free.</p>
        <div className="stack">
          <div className="grid-2">
            <div className="field"><label>Shipping charge (₹)</label><input className="input" type="number" min={0} value={form.shippingFee} onChange={text("shippingFee")} /></div>
            <div className="field"><label>Free shipping on orders of (₹) or more</label><input className="input" type="number" min={0} value={form.freeShippingAbove} onChange={text("freeShippingAbove")} /></div>
          </div>
          <label className="checkbox">
            <input type="checkbox" checked={form.codEnabled} onChange={(e) => setForm({ ...form, codEnabled: e.target.checked })} />
            Allow Cash on Delivery
          </label>
          {form.codEnabled && (
            <div className="field" style={{ maxWidth: 360 }}>
              <label>Extra charge for COD (₹)</label>
              <input className="input" type="number" min={0} value={form.codFee} onChange={text("codFee")} />
              <span className="hint">Set 0 for no extra charge.</span>
            </div>
          )}
        </div>
      </section>
      <section className="form-section">
        <h3>Store information</h3>
        <p className="hint">Shown in the footer, contact page and policy pages.</p>
        <div className="stack">
          <div className="grid-2">
            <div className="field"><label>Phone / WhatsApp</label><input className="input" value={form.storePhone} onChange={text("storePhone")} /></div>
            <div className="field"><label>Email</label><input className="input" type="email" value={form.storeEmail} onChange={text("storeEmail")} /></div>
          </div>
          <div className="field"><label>Address</label><input className="input" value={form.storeAddress} onChange={text("storeAddress")} /></div>
          <div className="field">
            <label>Announcement bar</label>
            <input className="input" value={form.announcement} onChange={text("announcement")} />
            <span className="hint">The green strip at the top of every page. Leave empty to hide it.</span>
          </div>
        </div>
      </section>
      {msg && <p className={`alert ${msg.ok ? "alert-success" : "alert-error"}`} style={{ marginBottom: 12 }}>{msg.text}</p>}
      <button className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Save settings"}</button>
    </form>
  );
}
