import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { formatINR } from "@/lib/pricing";

// NOTE FOR OWNER: these are general templates. Review them and change anything that
// does not match how you run your business before going live.

const TITLES: Record<string, string> = {
  privacy: "Privacy policy",
  terms: "Terms & conditions",
  refund: "Refund & cancellation policy",
  shipping: "Shipping policy",
};

type Props = { params: Promise<{ page: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: TITLES[(await params).page] || "Policy" };
}

export default async function PolicyPage({ params }: Props) {
  const { page } = await params;
  if (!TITLES[page]) notFound();
  const s = await getSettings();
  const contact = (
    <p>
      For any questions, contact us at <a className="link" href={`mailto:${s.storeEmail}`}>{s.storeEmail}</a> or{" "}
      {s.storePhone}. Address: {s.storeAddress}.
    </p>
  );

  return (
    <div className="container prose">
      <h1>{TITLES[page]}</h1>
      <p className="muted small">Last updated: {new Date().getFullYear()}</p>

      {page === "shipping" && (
        <>
          <p>We deliver to all serviceable pincodes across India.</p>
          <h2>Shipping charges</h2>
          <ul>
            <li>Orders of {formatINR(s.freeShippingAbove)} or more: <b>free shipping</b>.</li>
            <li>Orders below {formatINR(s.freeShippingAbove)}: a flat shipping charge of <b>{formatINR(s.shippingFee)}</b>.</li>
            {s.codEnabled && s.codFee > 0 && <li>Cash on Delivery orders have an additional charge of {formatINR(s.codFee)}.</li>}
          </ul>
          <h2>Delivery time</h2>
          <p>
            Orders are packed and dispatched within 1–3 working days from Leh, Ladakh. Delivery usually takes 4–9 working
            days depending on your location. Remote areas and weather conditions in Ladakh may cause occasional delays.
          </p>
          <h2>Tracking</h2>
          <p>Once your order ships, we will email you the courier name and tracking number. You can also check your order status on our Track Order page.</p>
        </>
      )}

      {page === "refund" && (
        <>
          <h2>Cancellation</h2>
          <p>You can cancel your order before it is shipped by contacting us with your order number. Prepaid orders cancelled before shipping are refunded in full.</p>
          <h2>Returns</h2>
          <p>
            As most of our products are food items, we cannot accept returns of opened products. If you receive a damaged,
            leaking, expired or wrong product, please contact us within 48 hours of delivery with photos of the package
            and product, and we will send a replacement or issue a refund.
          </p>
          <h2>Refunds</h2>
          <p>
            Approved refunds for online payments are processed to the original payment method within 5–7 working days.
            For Cash on Delivery orders, refunds are made by bank transfer or UPI.
          </p>
        </>
      )}

      {page === "privacy" && (
        <>
          <p>Rafail Natural respects your privacy. This policy explains what information we collect and how we use it.</p>
          <h2>Information we collect</h2>
          <ul>
            <li>Your name, email, phone number and delivery address when you place an order or create an account.</li>
            <li>Order history and basic technical information needed to run the website.</li>
          </ul>
          <h2>How we use it</h2>
          <ul>
            <li>To process, ship and deliver your orders and contact you about them.</li>
            <li>To provide customer support.</li>
          </ul>
          <h2>Payments</h2>
          <p>
            Online payments are made by UPI directly from your own payment app to our bank account. We never see or store your card, UPI PIN or bank details.
          </p>
          <h2>Sharing</h2>
          <p>We share your delivery details only with courier partners to deliver your order. We never sell your personal information.</p>
        </>
      )}

      {page === "terms" && (
        <>
          <p>By using this website and placing an order, you agree to these terms.</p>
          <h2>Products &amp; prices</h2>
          <p>
            All prices are in Indian Rupees (₹). Product images are for illustration; natural products may vary slightly in
            colour, size and taste. We may change prices and availability at any time. The price charged is the price shown at checkout.
          </p>
          <h2>Orders</h2>
          <p>We may cancel an order if a product is out of stock, the delivery address is not serviceable, or there is an error in pricing. In such cases any amount paid will be refunded in full.</p>
          <h2>Payments</h2>
          <p>Online payments are made by UPI (Scan &amp; Pay). Cash on Delivery may be available for selected orders.</p>
          <h2>Governing law</h2>
          <p>These terms are governed by the laws of India. Any disputes are subject to the jurisdiction of courts in Leh, Ladakh.</p>
        </>
      )}

      <h2>Contact</h2>
      {contact}
    </div>
  );
}
