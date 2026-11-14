import QRCode from "qrcode";

// Snow Land's SBI merchant UPI account, read from the shop's "Scan & Pay" QR code.
// Set UPI_VPA / UPI_PAYEE_NAME in .env to point payments somewhere else.
const VPA = process.env.UPI_VPA || "sbibhim.022211900593713-ym644481@sbipay";
const PAYEE = process.env.UPI_PAYEE_NAME || "SNOW LAND";
// Merchant details carried over unchanged from the bank's QR code.
const MERCHANT: Record<string, string> = process.env.UPI_VPA
  ? {}
  : { mc: "5499", mode: "01", orgid: "180080", mid: "022211900593713", msid: "26102026115456", purpose: "00" };

export const UPI_VPA = VPA;
export const UPI_PAYEE = PAYEE;

// A UPI payment link with the exact amount and the order number as the note,
// so the payment can be matched to the order in the bank app.
export function upiLink(amountRupees: number, orderNumber: string) {
  const params: Record<string, string> = {
    pa: VPA,
    pn: PAYEE,
    ...MERCHANT,
    am: amountRupees.toFixed(2),
    cu: "INR",
    tn: `Order ${orderNumber}`,
  };
  return "upi://pay?" + Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v).replace(/%40/g, "@")}`).join("&");
}

// The same link as a QR code image (data URL) for scanning from another phone.
export function upiQr(amountRupees: number, orderNumber: string) {
  return QRCode.toDataURL(upiLink(amountRupees, orderNumber), { width: 560, margin: 2, errorCorrectionLevel: "M" });
}
