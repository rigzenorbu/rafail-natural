"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatINR } from "@/lib/pricing";
import UpiReferenceForm from "./UpiReferenceForm";

type Props = {
  orderNumber: string;
  token: string;
  amount: number;
  payee: string;
  upiId: string;
  qr: string;
  link: string;
  whatsapp: string;
  phone: string;
  reference: string;
};

// The "Scan & Pay" box on the order page: one clear path in three steps.
export default function UpiPayment(p: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState("");
  const [sent, setSent] = useState(false);

  // When the shop marks the payment as received, this page turns into the "thank you" page by itself.
  useEffect(() => {
    const t = setInterval(() => !document.hidden && router.refresh(), 20000);
    return () => clearInterval(t);
  }, [router]);

  async function copy(what: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(""), 2000);
    } catch {}
  }

  const told = sent || Boolean(p.reference);

  return (
    <section className="card upi-box" aria-label="Pay by UPI">
      <header className="upi-box-head">
        <div>
          <div className="upi-eyebrow">Order {p.orderNumber}</div>
          <h1>Complete your payment</h1>
        </div>
        <span className={`upi-status ${told ? "is-checking" : ""}`}>
          <i aria-hidden="true" />
          {told ? "Checking your payment" : "Waiting for payment"}
        </span>
      </header>

      <div className="upi-amount">
        <span className="upi-amount-value">{formatINR(p.amount)}</span>
        <span className="muted">to <b>{p.payee}</b> by UPI</span>
      </div>

      <ol className="upi-track" aria-label="Steps">
        <li className="done">Scan the QR</li>
        <li className={told ? "done" : ""}>Pay {formatINR(p.amount)}</li>
        <li className={told ? "done" : ""}>Tell us you have paid</li>
      </ol>

      <div className="upi-grid">
        <div className="upi-qr-card">
          <img src={p.qr} alt={`UPI QR code to pay ${formatINR(p.amount)} to ${p.payee}`} width={260} height={260} />
          <div className="upi-qr-name">{p.payee}</div>
          <div className="upi-apps">Google Pay · PhonePe · Paytm · BHIM · YONO SBI</div>
          <a className="upi-save" href={p.qr} download={`Rafail-Natural-${p.orderNumber}.png`}>Save QR to phone</a>
        </div>

        <div className="upi-side">
          <a className="btn btn-accent btn-lg upi-open" href={p.link}>Pay with a UPI app on this phone</a>

          <div className="upi-step">
            <span className="upi-num">1</span>
            <div>
              <b>Scan with any UPI app</b>
              <p className="only-desktop">Open Google Pay, PhonePe, Paytm or any UPI app on your phone and scan this QR. The amount is already filled in.</p>
              <p className="only-phone">Tap the orange button to open your UPI app with the amount filled in. Or save the QR and scan it from your gallery.</p>
            </div>
          </div>
          <div className="upi-step">
            <span className="upi-num">2</span>
            <div>
              <b>Check the name says {p.payee}, then pay</b>
              <div className="upi-copy">
                <span>UPI ID</span>
                <code>{p.upiId}</code>
                <button type="button" onClick={() => copy("id", p.upiId)}>{copied === "id" ? "Copied" : "Copy"}</button>
              </div>
              <div className="upi-copy">
                <span>Amount</span>
                <code>{p.amount}</code>
                <button type="button" onClick={() => copy("amount", String(p.amount))}>{copied === "amount" ? "Copied" : "Copy"}</button>
              </div>
            </div>
          </div>
          <div className="upi-step">
            <span className="upi-num">3</span>
            <div>
              <b>Tell us you have paid</b>
              <p>Send the payment screenshot on WhatsApp. Your message is already written.</p>
              <a className="btn btn-lg btn-whatsapp" href={p.whatsapp} target="_blank" rel="noopener noreferrer" onClick={() => setSent(true)}>
                I have paid · send on WhatsApp
              </a>
              {p.reference && <p className="alert alert-info small" style={{ margin: "12px 0 0" }}>We have your UPI reference <b>{p.reference}</b> and are checking the payment.</p>}
              <details className="upi-ref-toggle" open={Boolean(p.reference)}>
                <summary>No WhatsApp? Enter the UPI reference number instead</summary>
                <UpiReferenceForm orderNumber={p.orderNumber} token={p.token} saved={p.reference} />
              </details>
            </div>
          </div>
        </div>
      </div>

      <footer className="upi-foot">
        <span aria-hidden="true">🔒</span> You pay straight into {p.payee}&apos;s SBI account from your own UPI app. We never see your UPI PIN. Your order is
        confirmed as soon as the payment reaches us; this page updates by itself. Questions? Call or WhatsApp {p.phone}.
      </footer>
    </section>
  );
}
