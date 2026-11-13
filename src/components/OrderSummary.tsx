import type { Quote } from "@/lib/orders";
import { formatINR } from "@/lib/pricing";

export default function OrderSummary({ quote }: { quote: Quote }) {
  const remaining = quote.freeShippingAbove - quote.itemsTotal;
  return (
    <>
      <div className="summary-row"><span>Price (MRP)</span><span>{formatINR(quote.subtotal)}</span></div>
      {quote.discount > 0 && (
        <div className="summary-row"><span>Discount</span><span className="green">−{formatINR(quote.discount)}</span></div>
      )}
      <div className="summary-row">
        <span>Shipping</span>
        <span className={quote.shippingFee ? "" : "green"}>{quote.shippingFee ? formatINR(quote.shippingFee) : "Free"}</span>
      </div>
      {quote.codFee > 0 && <div className="summary-row"><span>COD charge</span><span>{formatINR(quote.codFee)}</span></div>}
      <div className="summary-row total"><span>Total</span><span>{formatINR(quote.total)}</span></div>
      {quote.itemsTotal > 0 && (
        <div className={`ship-progress ${remaining <= 0 ? "done" : ""}`}>
          {remaining > 0
            ? `Add ${formatINR(remaining)} more to get free shipping`
            : "You get free shipping on this order"}
        </div>
      )}
      {quote.discount > 0 && <p className="small" style={{ color: "var(--green)", margin: 0 }}>You save {formatINR(quote.discount)} on this order</p>}
    </>
  );
}
