// npm run build. On the live server (DATA_DIR set) it also prepares the permanent data folder:
// creates or updates the database tables and adds the real catalogue if it is missing.
import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const run = (cmd, env = process.env) => execSync(cmd, { stdio: "inherit", env });
const raw = process.env.DATA_DIR?.trim();

run("npx prisma generate");
if (raw) {
  const dir = path.resolve(raw.startsWith("~") ? path.join(os.homedir(), raw.slice(1)) : raw);
  mkdirSync(path.join(dir, "uploads"), { recursive: true });
  mkdirSync(path.join(dir, "promo"), { recursive: true });
  const env = {
    ...process.env,
    DATABASE_URL: process.env.DATABASE_URL || `file:${path.join(dir, "shop.db")}`,
    UPLOAD_DIR: process.env.UPLOAD_DIR || path.join(dir, "uploads"),
  };
  console.log(`Data folder: ${dir}`);
  run("npx prisma db push --skip-generate", env);
  run("npx tsx prisma/seed-live.ts", env);
}
run("npx next build");
