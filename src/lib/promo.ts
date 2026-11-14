import { randomBytes } from "crypto";
import { mkdir, readdir, stat, unlink, writeFile } from "fs/promises";
import path from "path";
import { PROMOS } from "./paths";

// The home-page banner (a product video or advertisement image) lives in the "promo" folder.
// The newest video/image in that folder is shown. Replace it from Admin → Home banner,
// or simply drop a new file into the folder.
export const PROMO_DIR = PROMOS;

export const PROMO_TYPES: Record<string, { mime: string; kind: "video" | "image" }> = {
  mp4: { mime: "video/mp4", kind: "video" },
  webm: { mime: "video/webm", kind: "video" },
  mov: { mime: "video/quicktime", kind: "video" },
  jpg: { mime: "image/jpeg", kind: "image" },
  jpeg: { mime: "image/jpeg", kind: "image" },
  png: { mime: "image/png", kind: "image" },
  webp: { mime: "image/webp", kind: "image" },
  gif: { mime: "image/gif", kind: "image" },
};
const MAX_BYTES = 100 * 1024 * 1024;

// Only plain file names (no folders) with a supported extension.
export const PROMO_NAME = /^[\w][\w .-]*\.(mp4|webm|mov|jpg|jpeg|png|webp|gif)$/i;

export type Promo = { name: string; url: string; kind: "video" | "image"; size: number };

async function listPromos() {
  const names = await readdir(PROMO_DIR).catch(() => [] as string[]);
  const files = await Promise.all(
    names
      .filter((n) => PROMO_NAME.test(n))
      .map(async (name) => ({ name, info: await stat(path.join(PROMO_DIR, name)) }))
  );
  return files.filter((f) => f.info.isFile()).sort((a, b) => b.info.mtimeMs - a.info.mtimeMs);
}

export async function getPromo(): Promise<Promo | null> {
  const [latest] = await listPromos();
  if (!latest) return null;
  const ext = latest.name.split(".").pop()!.toLowerCase();
  return {
    name: latest.name,
    // The version stamp makes browsers fetch the new file after a replacement.
    url: `/promo/${encodeURIComponent(latest.name)}?v=${Math.round(latest.info.mtimeMs)}`,
    kind: PROMO_TYPES[ext].kind,
    size: latest.info.size,
  };
}

// Saves a new banner and removes the old ones, so the folder only ever holds the current banner.
export async function savePromo(file: File) {
  const ext = Object.keys(PROMO_TYPES).find((e) => PROMO_TYPES[e].mime === file.type);
  if (!ext) throw new Error("Only MP4, WEBM or MOV videos, or JPG, PNG, WEBP or GIF images are allowed");
  if (file.size > MAX_BYTES) throw new Error("File is larger than 100 MB");
  await mkdir(PROMO_DIR, { recursive: true });
  const old = await listPromos();
  await writeFile(
    path.join(PROMO_DIR, `banner-${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`),
    Buffer.from(await file.arrayBuffer())
  );
  await Promise.all(old.map((f) => unlink(path.join(PROMO_DIR, f.name)).catch(() => {})));
}

export async function deletePromo() {
  const files = await listPromos();
  await Promise.all(files.map((f) => unlink(path.join(PROMO_DIR, f.name)).catch(() => {})));
}
