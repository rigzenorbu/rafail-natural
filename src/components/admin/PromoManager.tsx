"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Promo } from "@/lib/promo";

export default function PromoManager({ promo }: { promo: Promo | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function upload(file: File | undefined) {
    if (!file) return;
    setMsg(null);
    setBusy("Uploading…");
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/admin/promo", { method: "POST", body });
    const data = await res.json().catch(() => ({}));
    setBusy("");
    setMsg(res.ok ? { ok: true, text: "Banner updated" } : { ok: false, text: data.error || "Upload failed" });
    router.refresh();
  }

  async function remove() {
    if (!confirm("Remove the home banner?")) return;
    setBusy("Removing…");
    await fetch("/api/admin/promo", { method: "DELETE" });
    setBusy("");
    setMsg({ ok: true, text: "Banner removed" });
    router.refresh();
  }

  return (
    <section className="form-section" style={{ maxWidth: 760 }}>
      <h3>Product video or advertisement</h3>
      <p className="hint">
        Shown big at the top of the home page, above the products. Upload a video (MP4 works on every phone and
        browser, up to 100 MB) or an advertisement image (JPG, PNG, WEBP). Wide pictures (16:9) look best. Videos
        play on a loop without sound until the visitor turns sound on.
      </p>

      {promo ? (
        <div className="promo-preview">
          {promo.kind === "video"
            ? <video src={promo.url} controls muted playsInline />
            : <img src={promo.url} alt="Current banner" />}
          <p className="hint">Current file: <code>promo/{promo.name}</code> ({(promo.size / 1024 / 1024).toFixed(1)} MB)</p>
        </div>
      ) : (
        <p className="alert alert-info">No banner yet. The home page shows the standard welcome section.</p>
      )}

      <div className="row" style={{ marginTop: 16 }}>
        <label className={`btn btn-primary${busy ? " disabled" : ""}`}>
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime,image/jpeg,image/png,image/webp,image/gif"
            hidden
            disabled={Boolean(busy)}
            onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }}
          />
          {busy || (promo ? "Replace banner" : "Upload banner")}
        </label>
        {promo && <button type="button" className="btn btn-danger" disabled={Boolean(busy)} onClick={remove}>Remove</button>}
      </div>
      {msg && <p className={`alert ${msg.ok ? "alert-success" : "alert-error"}`} style={{ marginTop: 12 }}>{msg.text}</p>}
      <p className="hint" style={{ marginTop: 16 }}>
        You can also replace it without the admin panel: put a video or image into the <code>promo</code> folder of
        the website. The newest file in that folder is the one shown.
      </p>
    </section>
  );
}
