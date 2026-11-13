"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setBusy(false);
    if (!res.ok) return setError((await res.json()).error || "Login failed");
    router.push("/admin");
    router.refresh();
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-soft)", display: "grid", placeItems: "center", padding: 16 }}>
      <form className="card stack" style={{ width: "100%", maxWidth: 380 }} onSubmit={submit}>
        <span className="logo"><span className="logo-mark">R</span><span>Rafail Natural<small>Admin panel</small></span></span>
        <div className="field"><label>Email</label><input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="field"><label>Password</label><input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        {error && <p className="alert alert-error small">{error}</p>}
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? "Logging in…" : "Log in"}</button>
      </form>
    </div>
  );
}
