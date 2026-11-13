"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AuthForm({ mode, next }: { mode: "login" | "register"; next: string }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/account";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error || "Something went wrong");
    router.push(safeNext);
    router.refresh();
  }

  return (
    <div className="container">
      <div className="auth-box card">
        <h1 style={{ fontSize: "1.5rem" }}>{mode === "login" ? "Log in" : "Create an account"}</h1>
        <p className="muted">
          {mode === "login" ? "Welcome back! Log in to see your orders." : "Save your details and track all your orders in one place."}
        </p>
        <form className="stack" onSubmit={submit}>
          {mode === "register" && (
            <>
              <div className="field"><label>Full name</label><input className="input" required value={form.name} onChange={set("name")} autoComplete="name" /></div>
              <div className="field"><label>Mobile number</label><input className="input" value={form.phone} onChange={set("phone")} inputMode="numeric" autoComplete="tel" /></div>
            </>
          )}
          <div className="field"><label>Email</label><input className="input" type="email" required value={form.email} onChange={set("email")} autoComplete="email" /></div>
          <div className="field">
            <label>Password</label>
            <input className="input" type="password" required minLength={6} value={form.password} onChange={set("password")} autoComplete={mode === "login" ? "current-password" : "new-password"} />
          </div>
          {error && <p className="alert alert-error small">{error}</p>}
          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>
        <p className="center small" style={{ marginTop: 18, marginBottom: 0 }}>
          {mode === "login" ? (
            <>New here? <Link className="link" href={`/register?next=${encodeURIComponent(safeNext)}`}>Create an account</Link></>
          ) : (
            <>Already have an account? <Link className="link" href={`/login?next=${encodeURIComponent(safeNext)}`}>Log in</Link></>
          )}
        </p>
      </div>
    </div>
  );
}
