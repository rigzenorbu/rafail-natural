import os from "os";
import path from "path";

// Where the shop keeps what must survive updates: the database, product photos and the home banner.
// On the live server DATA_DIR points at a folder outside the app (e.g. "~/rafail-data"),
// because each new deploy replaces the app's own folder. Locally it is unset and the
// project folders are used, as before.
export function dataDir() {
  const d = process.env.DATA_DIR?.trim();
  if (!d) return null;
  return path.resolve(d.startsWith("~") ? path.join(os.homedir(), d.slice(1)) : d);
}

export function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const d = dataDir();
  return d ? `file:${path.join(d, "shop.db")}` : "file:./dev.db";
}

export const UPLOADS = process.env.UPLOAD_DIR || (dataDir() ? path.join(dataDir()!, "uploads") : path.join(process.cwd(), "uploads"));
export const PROMOS = process.env.PROMO_DIR || (dataDir() ? path.join(dataDir()!, "promo") : path.join(process.cwd(), "promo"));
