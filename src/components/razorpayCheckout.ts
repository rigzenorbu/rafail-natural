"use client";

// Loads Razorpay's script and opens the payment popup.
declare global {
  interface Window {
    Razorpay?: any;
  }
}

function loadScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export type RazorpayResult =
  | { status: "success"; orderNumber: string; token: string }
  | { status: "dismissed" }
  | { status: "error"; message: string };

export async function payWithRazorpay(options: Record<string, any>): Promise<RazorpayResult> {
  if (!(await loadScript())) return { status: "error", message: "Could not load the payment page. Check your internet connection." };

  return new Promise((resolve) => {
    const rzp = new window.Razorpay!({
      ...options,
      handler: async (response: Record<string, string>) => {
        try {
          const res = await fetch("/api/checkout/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          const data = await res.json();
          if (!res.ok) return resolve({ status: "error", message: data.error || "Payment verification failed" });
          resolve({ status: "success", orderNumber: data.orderNumber, token: data.token });
        } catch {
          resolve({ status: "error", message: "Payment received but confirmation failed. Please contact us with your order number." });
        }
      },
      modal: { ondismiss: () => resolve({ status: "dismissed" }) },
    });
    rzp.on("payment.failed", () => {
      // Razorpay shows its own error and lets the customer retry inside the popup.
    });
    rzp.open();
  });
}
