# Rafail Natural – Online Store

An online store for Ladakhi products: product catalogue, cart, Buy Now, checkout with
Razorpay (UPI / cards / net banking) and Cash on Delivery, customer accounts, order tracking,
and an admin panel to manage products, orders and settings.

Built with Next.js, Prisma, SQLite (local) / PostgreSQL (live), and Razorpay.

---

## 1. Run it on your computer

Requires Node.js 20 or newer.

```bash
npm install          # first time only
npm run setup        # first time only: creates the database and adds sample products
npm run dev          # start the site
```

Open **http://localhost:3000** (if port 3000 is busy: `npm run dev -- -p 3100`).

| What | Where |
|---|---|
| Store | http://localhost:3000 |
| Admin panel | http://localhost:3000/admin |
| Admin login | the `ADMIN_EMAIL` / `ADMIN_PASSWORD` values in `.env` (default `admin@rafailnatural.com` / `admin123`) |

> **Change `ADMIN_PASSWORD` in `.env`** to something strong before going live.

---

## 2. Managing the store (admin panel)

- **Products → + Add product**: name, category, short and full description, photos
  (upload from computer or phone; the first photo is the main one, and the arrows reorder them),
  and one row per **size** (e.g. 250 g / 500 g / 1 kg) with its own **weight, MRP, discount % and stock**.
  The selling price is calculated automatically.
- **Edit** any product to change prices, discount, stock, photos or text.
  Untick **Visible in store** to hide a product without deleting it.
- **Categories**: add, rename or delete categories.
- **Home banner**: upload a product video (MP4, up to 100 MB) or an advertisement image. It is shown big at the
  top of the home page, with the full product catalogue below it. The file is stored in the `promo/` folder, so you
  can also just drop a new video or image there; the newest file is shown. No file → the standard welcome section.
- **Orders**: every order with customer address, items, payment status and the Razorpay payment ID.
  Set the status to *Shipped* (add courier and tracking number), *Delivered* or *Cancelled*; the customer
  is emailed automatically. Cancelling puts the stock back. For COD orders, mark payment as *Paid* when
  you receive the cash.
- **Settings**: shipping charge, free-shipping amount (currently ₹1000), COD on/off and COD charge,
  store phone/email/address, announcement bar text.

Sample products: replace them with your real products, or remove them all and start fresh with
`npm run db:seed -- --reset` (that re-creates the samples, so delete them from the admin panel instead
if you want an empty store).

**Policy pages** (`/policies/shipping`, `/refund`, `/privacy`, `/terms`) are general templates.
Read them and edit `src/app/(shop)/policies/[page]/page.tsx` if anything differs from how you work.
Razorpay checks these pages during approval.

---

## 3. Connecting services (`.env` file)

All keys live in the `.env` file (never share it or upload it to GitHub). See `.env.example`.

### Razorpay (online payments)
1. Sign up at https://dashboard.razorpay.com. You can use **Test Mode** immediately.
2. *Account & Settings → API Keys → Generate key*. Put them in `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
3. *Account & Settings → Webhooks → Add webhook* (only once the site is live on a public URL):
   - URL: `https://YOUR-DOMAIN/api/razorpay/webhook`
   - Secret: any long random text, also put in `RAZORPAY_WEBHOOK_SECRET`
   - Events: `payment.captured`, `order.paid`, `payment.failed`
4. Restart the site. Test with Razorpay's test UPI ID `success@razorpay` or test cards.
5. After KYC approval, generate **Live** keys and replace the test keys.

Without Razorpay keys the store still works with Cash on Delivery only.

### Emails (order confirmations + new-order alerts to you)
Use any SMTP provider, e.g. **Brevo** (free, 300 emails/day) or **Zoho Mail**.
Fill `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`, and set
`ADMIN_NOTIFY_EMAIL` to the address where you want to receive new orders.
Until this is set, emails are only printed in the terminal.

### Cloudinary (product photos, recommended when live)
Sign up free at https://cloudinary.com and fill `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`,
`CLOUDINARY_API_SECRET`. Without it, photos are saved in the `uploads/` folder.

---

## 4. Going live

Recommended setup: **Railway** (hosting + PostgreSQL in one place, about $5/month) + **Cloudinary** (free).

1. **Switch the database to PostgreSQL.** In `prisma/schema.prisma` change
   `provider = "sqlite"` → `provider = "postgresql"`.
2. Put the code on GitHub (the `.env` file is ignored automatically).
3. On https://railway.app: *New Project → Deploy from GitHub repo*, then *+ New → Database → PostgreSQL*.
4. In the app's **Variables**, add everything from your `.env`, with:
   - `DATABASE_URL` = the PostgreSQL connection URL from Railway
   - `NEXT_PUBLIC_SITE_URL` = `https://your-domain.in`
   - a new strong `AUTH_SECRET` and `ADMIN_PASSWORD`
   - your Cloudinary keys (so photos are stored safely)
5. Set the **Start command** to `npx prisma db push && npm start`.
   Run `npx prisma db push && npx tsx prisma/seed.ts` once if you want the sample products there too.
6. **Domain**: buy one (e.g. `rafailnatural.in` from GoDaddy / Hostinger / Cloudflare), then in Railway
   *Settings → Domains → Custom domain* and add the DNS record it shows at your domain provider.
   HTTPS is set up automatically.
7. Add the Razorpay webhook (step 3 above) with your real domain, and switch to live keys after KYC.

Other hosts (Render, a VPS, Vercel with a hosted Postgres such as Neon) also work. On hosts
without permanent disk storage (like Vercel), Cloudinary is **required** for photos.

---

## 5. Project structure

```
prisma/schema.prisma         database tables (products, sizes, orders, customers, settings)
prisma/seed.ts               sample Ladakhi products
src/app/(shop)/              customer pages (home, shop, product, cart, checkout, orders, account, policies)
src/app/admin/               admin panel pages
src/app/api/                 server endpoints (checkout, payments, webhook, admin actions)
src/lib/orders.ts            pricing, shipping, order creation, payment confirmation, stock
src/components/              shared UI (header, cart, product cards, admin forms)
src/app/globals.css          all styling (colours at the top)
```

Useful commands: `npm run db:studio` opens a spreadsheet-like view of the database.
