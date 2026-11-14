import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";

export default async function Footer() {
  const [settings, categories] = await Promise.all([
    getSettings(),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, take: 6 }),
  ]);
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <h4>Rafail Natural</h4>
            <p>Natural products from the high-altitude valleys of Ladakh: seabuckthorn, apricots, apples and more, sourced from local farmers and delivered across India.</p>
          </div>
          <div>
            <h4>Shop</h4>
            <ul>
              <li><Link href="/products">All products</Link></li>
              {categories.map((c) => (
                <li key={c.id}><Link href={`/products?category=${c.slug}`}>{c.name}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Help</h4>
            <ul>
              <li><Link href="/track">Track order</Link></li>
              <li><Link href="/policies/shipping">Shipping policy</Link></li>
              <li><Link href="/policies/refund">Refund &amp; cancellation</Link></li>
              <li><Link href="/policies/privacy">Privacy policy</Link></li>
              <li><Link href="/policies/terms">Terms &amp; conditions</Link></li>
            </ul>
          </div>
          <div>
            <h4>Contact</h4>
            <ul>
              <li>{settings.storeAddress}</li>
              <li><a href={`tel:${settings.storePhone.replace(/\s/g, "")}`}>{settings.storePhone}</a></li>
              <li><a href={`mailto:${settings.storeEmail}`}>{settings.storeEmail}</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Rafail Natural. All rights reserved.</span>
          <span>UPI Scan & Pay · Cash on Delivery</span>
          <span>Developed by <b className="footer-credit">Third Pole Solutions</b></span>
        </div>
      </div>
    </footer>
  );
}
