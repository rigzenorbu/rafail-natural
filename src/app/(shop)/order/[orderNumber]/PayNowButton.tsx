"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { payWithRazorpay } from "@/components/razorpayCheckout";
import { formatINR } from "@/lib/pricing";

export default function PayNowButton({ orderNumber, token, total }: { orderNumber: string; token: string; total: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function pay() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/orders/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not start payment");
      const result = await payWithRazorpay(data.razorpay);
      if (result.status === "success") router.refresh();
      else if (result.status === "error") setError(result.message);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button className="btn btn-primary btn-lg" onClick={pay} disabled={busy}>
        {busy ? "Please wait…" : `Pay ${formatINR(total)} now`}
      </button>
      {error && <p className="alert alert-error small" style={{ marginTop: 12 }}>{error}</p>}
    </div>
  );
}
