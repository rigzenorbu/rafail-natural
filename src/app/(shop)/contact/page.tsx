import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Contact us" };

export default async function ContactPage() {
  const s = await getSettings();
  return (
    <div className="container prose">
      <h1>Contact us</h1>
      <p>We&apos;re happy to help with orders, delivery, or any questions about our products.</p>
      <div className="card">
        <p><b>Phone / WhatsApp:</b> <a className="link" href={`tel:${s.storePhone.replace(/\s/g, "")}`}>{s.storePhone}</a></p>
        <p><b>Email:</b> <a className="link" href={`mailto:${s.storeEmail}`}>{s.storeEmail}</a></p>
        <p style={{ margin: 0 }}><b>Address:</b> {s.storeAddress}</p>
      </div>
      <p className="muted small" style={{ marginTop: 16 }}>We usually reply within 24 hours (Monday to Saturday).</p>
    </div>
  );
}
