"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart, type CartItem } from "@/components/CartProvider";
import { useQuote } from "@/components/useQuote";
import OrderSummary from "@/components/OrderSummary";
import { payWithRazorpay } from "@/components/razorpayCheckout";
import { INDIAN_STATES } from "@/lib/constants";
import { formatINR } from "@/lib/pricing";

type Props = {
  buyNow: CartItem | null;
  user: { name: string; email: string; phone: string } | null;
};

const SAVED_ADDRESS_KEY = "rn_address";

export default function CheckoutForm({ buyNow, user }: Props) {
  const router = useRouter();
  const cart = useCart();
  const items = buyNow ? [buyNow] : cart.loaded ? cart.items : null;

  const [method, setMethod] = useState<"ONLINE" | "COD" | "UPI">("UPI");
  const { quote, loading } = useQuote(items, method);
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    notes: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pending, setPending] = useState<{ orderNumber: string; token: string; razorpay: any } | null>(null);

  // Remember the address on this device for next time.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVED_ADDRESS_KEY) || "null");
      if (saved) setForm((f) => ({ ...f, ...Object.fromEntries(Object.entries(saved).filter(([k, v]) => v && !(f as any)[k])) }));
    } catch {}
  }, []);

  // Pick a payment method that is actually available.
  useEffect(() => {
    if (!quote) return;
    if (method === "ONLINE" && !quote.onlineEnabled) setMethod("UPI");
    if (method === "COD" && !quote.codEnabled) setMethod("UPI");
  }, [quote, method]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  function finish(orderNumber: string, token: string) {
    if (!buyNow) cart.clear();
    router.push(`/order/${orderNumber}?t=${token}`);
  }

  async function openPayment(p: NonNullable<typeof pending>) {
    setSubmitting(true);
    const result = await payWithRazorpay(p.razorpay);
    setSubmitting(false);
    if (result.status === "success") return finish(result.orderNumber, result.token);
    if (result.status === "error") setError(result.message);
    else setError("Payment was not completed. You can try again.");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (pending) return openPayment(pending);
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, customer: form, paymentMethod: method }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      try {
        const { notes, ...address } = form;
        void notes;
        localStorage.setItem(SAVED_ADDRESS_KEY, JSON.stringify(address));
      } catch {}
      if (!data.razorpay) return finish(data.orderNumber, data.token);
      setPending(data);
      setSubmitting(false);
      await openPayment(data);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  if (!items || (loading && !quote)) return <p className="muted">Loading…</p>;
  if (items.length === 0) {
    return (
      <div className="empty">
        <p>Your cart is empty.</p>
        <Link href="/products" className="btn btn-primary">Start shopping</Link>
      </div>
    );
  }
  if (!quote) return <p className="alert alert-error">Could not load prices. Please refresh the page.</p>;

  const noPayment = !quote.onlineEnabled && !quote.codEnabled && !quote.upiEnabled;
  const locked = Boolean(pending);

  return (
    <form className="cart-layout" onSubmit={submit}>
      <div className="stack">
        {!user && (
          <div className="alert alert-info small">
            Have an account? <Link href="/login?next=/checkout" className="link">Log in</Link> to see your orders later, or continue as a guest.
          </div>
        )}
        <fieldset className="card" disabled={locked} style={{ margin: 0 }}>
          <h3>Contact &amp; delivery address</h3>
          <div className="stack">
            <div className="grid-2">
              <div className="field"><label>Full name *</label><input className="input" required value={form.name} onChange={set("name")} autoComplete="name" /></div>
              <div className="field"><label>Mobile number *</label><input className="input" required value={form.phone} onChange={set("phone")} inputMode="numeric" placeholder="10-digit mobile" autoComplete="tel" /></div>
            </div>
            <div className="field"><label>Email *</label><input className="input" type="email" required value={form.email} onChange={set("email")} autoComplete="email" /><span className="hint">Order confirmation will be sent here</span></div>
            <div className="field"><label>Address (house no., street, area) *</label><input className="input" required value={form.addressLine1} onChange={set("addressLine1")} autoComplete="address-line1" /></div>
            <div className="field"><label>Landmark (optional)</label><input className="input" value={form.addressLine2} onChange={set("addressLine2")} autoComplete="address-line2" /></div>
            <div className="grid-3">
              <div className="field"><label>City *</label><input className="input" required value={form.city} onChange={set("city")} autoComplete="address-level2" /></div>
              <div className="field">
                <label>State *</label>
                <select className="select" required value={form.state} onChange={set("state")}>
                  <option value="">Select</option>
                  {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="field"><label>Pincode *</label><input className="input" required value={form.pincode} onChange={set("pincode")} inputMode="numeric" maxLength={6} autoComplete="postal-code" /></div>
            </div>
            <div className="field"><label>Order note (optional)</label><input className="input" value={form.notes} onChange={set("notes")} placeholder="Any instructions for delivery" /></div>
          </div>
        </fieldset>

        <fieldset className="card" disabled={locked} style={{ margin: 0 }}>
          <h3>Payment method</h3>
          <div className="stack">
            {quote.upiEnabled && (
              <label className={`pay-option ${method === "UPI" ? "active" : ""}`}>
                <input type="radio" name="method" checked={method === "UPI"} onChange={() => setMethod("UPI")} />
                <span>
                  <strong>Scan &amp; Pay (UPI / QR)</strong>
                  <span className="muted small">Pay with any UPI app: Google Pay, PhonePe, Paytm, BHIM, YONO SBI. You get the QR code on the next screen.</span>
                </span>
              </label>
            )}
            {quote.onlineEnabled && (
              <label className={`pay-option ${method === "ONLINE" ? "active" : ""}`}>
                <input type="radio" name="method" checked={method === "ONLINE"} onChange={() => setMethod("ONLINE")} />
                <span><strong>Pay online</strong><span className="muted small">Debit/credit card, net banking or wallet (secured by Razorpay)</span></span>
              </label>
            )}
            {quote.codEnabled && (
              <label className={`pay-option ${method === "COD" ? "active" : ""}`}>
                <input type="radio" name="method" checked={method === "COD"} onChange={() => setMethod("COD")} />
                <span>
                  <strong>Cash on Delivery</strong>
                  <span className="muted small">Pay in cash or UPI when the order arrives</span>
                </span>
              </label>
            )}
            {noPayment && <p className="alert alert-error">Ordering is temporarily unavailable. Please contact us.</p>}
          </div>
        </fieldset>
      </div>

      <div className="card">
        <h3>Your order</h3>
        {quote.lines.map((l) =>
          l.available ? (
            <div className="mini-item" key={l.variantId}>
              {l.image ? <img src={l.image} alt="" /> : <div />}
              <div className="grow">
                <div>{l.name}</div>
                <div className="muted small">{l.label} × {l.quantity}</div>
                {l.error && <div className="small" style={{ color: "var(--red)" }}>{l.error}</div>}
              </div>
              <b>{formatINR(l.lineTotal)}</b>
            </div>
          ) : (
            <div className="mini-item muted" key={l.variantId}>{l.error}</div>
          )
        )}
        <div style={{ marginTop: 10 }}>
          <OrderSummary quote={quote} />
        </div>
        {error && <p className="alert alert-error small" style={{ marginTop: 12 }}>{error}</p>}
        {quote.hasProblems && !buyNow && (
          <p className="alert alert-error small" style={{ marginTop: 12 }}>
            Some items are unavailable. <Link href="/cart" className="link">Update your cart</Link>
          </p>
        )}
        <button
          type="submit"
          className="btn btn-primary btn-lg btn-block"
          style={{ marginTop: 16 }}
          disabled={submitting || quote.hasProblems || noPayment}
        >
          {submitting
            ? "Please wait…"
            : pending
              ? `Retry payment of ${formatINR(quote.total)}`
              : method === "COD"
                ? `Place order (${formatINR(quote.total)})`
                : method === "UPI"
                  ? `Place order & pay ${formatINR(quote.total)}`
                  : `Pay ${formatINR(quote.total)}`}
        </button>
        <p className="muted small center" style={{ marginTop: 10, marginBottom: 0 }}>
          By placing the order you agree to our <Link href="/policies/terms" className="link">terms</Link> and{" "}
          <Link href="/policies/refund" className="link">refund policy</Link>.
        </p>
      </div>
    </form>
  );
}
