// Fills the store with sample Ladakhi products so the site can be tried out.
// Run:  npm run db:seed          (only adds data if the store is empty)
//       npm run db:seed -- --reset   (deletes ALL products and categories first)
// Replace these with real products from the admin panel.

import { PrismaClient } from "@prisma/client";
import { mkdirSync, writeFileSync } from "fs";
import path from "path";

const prisma = new PrismaClient();
const UPLOAD_DIR = path.join(process.cwd(), "uploads");

type Shape = "bottle" | "jar" | "berries" | "fruit" | "bag" | "box" | "apple";

// ---------- Placeholder images (simple illustrations, replace with real photos) ----------
function shapeSvg(shape: Shape, c: string, c2: string) {
  switch (shape) {
    case "bottle":
      return `<rect x="355" y="170" width="90" height="70" rx="10" fill="${c2}"/>
        <path d="M340 240 h120 v40 q60 30 60 100 v220 q0 40 -40 40 h-160 q-40 0 -40 -40 v-220 q0 -70 60 -100z" fill="${c}"/>
        <rect x="300" y="400" width="200" height="140" rx="8" fill="#fff" opacity="0.85"/>
        <rect x="330" y="440" width="140" height="14" rx="7" fill="${c2}" opacity="0.6"/>
        <rect x="350" y="475" width="100" height="10" rx="5" fill="${c2}" opacity="0.4"/>`;
    case "jar":
      return `<rect x="300" y="230" width="200" height="60" rx="12" fill="${c2}"/>
        <rect x="270" y="285" width="260" height="320" rx="40" fill="${c}"/>
        <rect x="300" y="380" width="200" height="130" rx="8" fill="#fff" opacity="0.85"/>
        <rect x="330" y="420" width="140" height="14" rx="7" fill="${c2}" opacity="0.6"/>
        <rect x="350" y="455" width="100" height="10" rx="5" fill="${c2}" opacity="0.4"/>`;
    case "berries": {
      const pts = [[400, 330], [350, 370], [450, 370], [310, 420], [400, 410], [490, 420], [350, 460], [450, 460], [400, 500], [400, 450]];
      return `<path d="M400 230 q-10 -60 -80 -80" stroke="#6b5a3a" stroke-width="10" fill="none"/>
        <ellipse cx="300" cy="190" rx="60" ry="24" fill="#7a9a5a" transform="rotate(-25 300 190)"/>
        <ellipse cx="480" cy="230" rx="60" ry="22" fill="#7a9a5a" transform="rotate(20 480 230)"/>
        ${pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="42" fill="${c}"/><circle cx="${x - 12}" cy="${y - 12}" r="10" fill="#fff" opacity="0.5"/>`).join("")}`;
    }
    case "fruit":
      return `<circle cx="330" cy="420" r="120" fill="${c}"/><circle cx="480" cy="400" r="110" fill="${c2}"/>
        <circle cx="300" cy="380" r="25" fill="#fff" opacity="0.35"/><circle cx="455" cy="360" r="22" fill="#fff" opacity="0.35"/>
        <path d="M330 300 q10 -40 40 -50" stroke="#6b5a3a" stroke-width="8" fill="none"/>`;
    case "apple":
      return `<path d="M400 300 c-60 -50 -190 -30 -190 110 c0 120 90 200 140 200 c25 0 35 -12 50 -12 c15 0 25 12 50 12 c50 0 140 -80 140 -200 c0 -140 -130 -160 -190 -110z" fill="${c}"/>
        <path d="M400 300 q0 -60 30 -90" stroke="#6b5a3a" stroke-width="10" fill="none"/>
        <ellipse cx="465" cy="220" rx="50" ry="22" fill="#6a9a4a" transform="rotate(-25 465 220)"/>
        <ellipse cx="300" cy="390" rx="25" ry="45" fill="#fff" opacity="0.3"/>`;
    case "bag":
      return `<path d="M290 260 h220 l30 360 h-280z" fill="${c}"/>
        <path d="M290 260 l-10 -40 h240 l-10 40z" fill="${c2}"/>
        <rect x="320" y="380" width="160" height="130" rx="8" fill="#fff" opacity="0.85"/>
        <rect x="345" y="420" width="110" height="14" rx="7" fill="${c2}" opacity="0.6"/>
        <rect x="360" y="455" width="80" height="10" rx="5" fill="${c2}" opacity="0.4"/>`;
    case "box":
      return `<rect x="230" y="320" width="340" height="280" rx="10" fill="${c}"/>
        <rect x="210" y="280" width="380" height="70" rx="10" fill="${c2}"/>
        <rect x="380" y="280" width="40" height="320" fill="#fff" opacity="0.7"/>
        <path d="M400 280 q-80 -90 -110 -20 q40 30 110 20 q70 10 110 -20 q-30 -70 -110 20z" fill="#fff" opacity="0.85"/>`;
  }
}

function placeholderSvg(name: string, shape: Shape, bg: string, c: string, c2: string) {
  const safe = name.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg}"/><stop offset="1" stop-color="#ffffff"/></linearGradient></defs>
  <rect width="800" height="800" fill="url(#g)"/>
  <path d="M0 640 L180 470 L300 560 L470 380 L640 540 L800 430 L800 800 L0 800z" fill="#000" opacity="0.04"/>
  ${shapeSvg(shape, c, c2)}
  <text x="400" y="700" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="40" font-weight="700" fill="#2b2b2b">${safe}</text>
  <text x="400" y="745" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="22" letter-spacing="4" fill="#7a7a7a">RAFAIL NATURAL · LADAKH</text>
</svg>`;
}

function saveImage(file: string, svg: string) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
  writeFileSync(path.join(UPLOAD_DIR, file), svg);
  return `/uploads/${file}`;
}

// ---------- Sample data ----------
const categories = [
  { name: "Seabuckthorn", slug: "seabuckthorn" },
  { name: "Apricot", slug: "apricot" },
  { name: "Apple", slug: "apple" },
  { name: "Herbal Teas", slug: "herbal-teas" },
  { name: "Traditional Foods", slug: "traditional-foods" },
];

type SeedProduct = {
  name: string;
  category: string;
  short: string;
  description: string;
  featured?: boolean;
  image: [Shape, string, string, string];
  variants: [label: string, grams: number, price: number, discount: number, stock: number][];
};

const products: SeedProduct[] = [
  {
    name: "Seabuckthorn Juice",
    category: "seabuckthorn",
    short: "Pure Himalayan seabuckthorn juice, rich in Vitamin C and Omega 3, 6, 7 & 9.",
    featured: true,
    image: ["bottle", "#fdebd3", "#e8811a", "#9c4f0b"],
    description: `Our seabuckthorn juice is made from wild berries hand-picked in the Nubra and Changthang valleys of Ladakh. Known as the "wonder berry", seabuckthorn has been used in Ladakhi homes for generations.

- Rich in Vitamin C (more than oranges)
- Contains rare Omega 7 fatty acids
- Supports immunity, skin and digestion
- No added colour or preservatives

How to use: Mix 30 ml with a glass of water or juice. Shake well before use. Refrigerate after opening and consume within 30 days.`,
    variants: [["500 ml", 500, 450, 10, 40], ["1 L", 1000, 850, 15, 25]],
  },
  {
    name: "Seabuckthorn Herbal Tea",
    category: "herbal-teas",
    short: "Caffeine-free leaf tea from seabuckthorn leaves. Light, tangy and refreshing.",
    image: ["bag", "#eaf2e1", "#7d9b52", "#4f6a30"],
    description: `Dried seabuckthorn leaves blended for a soothing, caffeine-free cup. Naturally rich in antioxidants.

- 100% natural, caffeine-free
- Brew 1 teaspoon in hot water for 3–4 minutes
- Enjoy plain or with honey`,
    variants: [["50 g", 50, 220, 0, 60], ["100 g", 100, 399, 5, 40]],
  },
  {
    name: "Seabuckthorn Jam",
    category: "seabuckthorn",
    short: "Tangy, bright-orange jam made with real seabuckthorn berries.",
    image: ["jar", "#fff0dc", "#f08c1c", "#a85a10"],
    description: `A tangy-sweet jam made in small batches in Leh. Perfect on toast, paratha, or with yoghurt.

- Made with real seabuckthorn pulp
- No artificial colour`,
    variants: [["250 g", 250, 280, 0, 30]],
  },
  {
    name: "Ladakhi Dried Apricots (Khubani)",
    category: "apricot",
    short: "Sun-dried apricots from Kargil and Leh. Naturally sweet, no added sugar.",
    featured: true,
    image: ["fruit", "#fdf0dd", "#f2a541", "#e08a2a"],
    description: `Ladakh's famous apricots, dried naturally under the mountain sun. Sweet, chewy and full of fibre and iron.

- Naturally sun-dried, no sulphur
- No added sugar
- Great as a snack or in desserts

Storage: Keep in an airtight container in a cool, dry place.`,
    variants: [["250 g", 250, 350, 0, 50], ["500 g", 500, 650, 10, 40], ["1 kg", 1000, 1200, 15, 20]],
  },
  {
    name: "Apricot Kernel Oil (Cold-Pressed)",
    category: "apricot",
    short: "Traditional Ladakhi cold-pressed oil for skin, hair and massage.",
    featured: true,
    image: ["bottle", "#fbf3df", "#d8a640", "#8a6514"],
    description: `Pressed from the kernels of sweet Ladakhi apricots using traditional methods. Light, non-sticky and gentle.

- Moisturises dry skin and lips
- Nourishes hair and scalp
- Ideal for baby and body massage

For external use.`,
    variants: [["100 ml", 100, 420, 0, 35], ["200 ml", 200, 780, 10, 20]],
  },
  {
    name: "Apricot Jam",
    category: "apricot",
    short: "Homestyle jam made with Ladakhi apricots.",
    image: ["jar", "#fdf1e2", "#e9973a", "#9a5a14"],
    description: `Made with ripe Ladakhi apricots and a little sugar. Spread on bread or use in baking.`,
    variants: [["250 g", 250, 260, 0, 30]],
  },
  {
    name: "Fresh Ladakhi Apples",
    category: "apple",
    short: "Crisp, juicy apples from the orchards of Ladakh. Seasonal.",
    image: ["apple", "#fde8e6", "#c8332b", "#7a1a14"],
    description: `Grown at high altitude without chemical sprays, Ladakhi apples are small, crisp and very sweet.

- Seasonal: available from September to November
- Packed carefully to avoid bruising`,
    variants: [["1 kg", 1000, 280, 0, 30], ["2 kg", 2000, 520, 5, 20]],
  },
  {
    name: "Dried Apple Chips",
    category: "apple",
    short: "Thin-sliced, naturally dried apple chips. A healthy crunchy snack.",
    image: ["bag", "#fdf0ec", "#d65a45", "#7a2a1c"],
    description: `Slices of Ladakhi apple, dried slowly to keep their natural sweetness. No oil, no added sugar.`,
    variants: [["100 g", 100, 180, 0, 40], ["250 g", 250, 420, 10, 25]],
  },
  {
    name: "Tsampa (Roasted Barley Flour)",
    category: "traditional-foods",
    short: "Traditional Ladakhi staple made from roasted local barley.",
    image: ["bag", "#f4eee2", "#b89b6a", "#6e5a35"],
    description: `Tsampa (ngamphe) is the traditional food of Ladakh, made from roasted barley grown in the Indus valley. Rich in fibre and energy.

- Mix with butter tea, milk or water
- Use in porridge and laddoos`,
    variants: [["500 g", 500, 220, 0, 40], ["1 kg", 1000, 400, 5, 25]],
  },
  {
    name: "Wild Thyme Tea (Tangtse)",
    category: "herbal-teas",
    short: "Fragrant wild thyme hand-collected from the hills of Changthang.",
    image: ["bag", "#ece9f4", "#7d6aa8", "#463a6a"],
    description: `Wild thyme gathered by local families in the Changthang region. Aromatic and calming.

- Brew a pinch in hot water for 5 minutes
- Caffeine-free`,
    variants: [["50 g", 50, 250, 0, 30]],
  },
  {
    name: "Ladakh Gift Hamper",
    category: "traditional-foods",
    short: "Seabuckthorn juice, dried apricots, apricot jam and herbal tea in a gift box.",
    featured: true,
    image: ["box", "#e9f0ea", "#2f5d3a", "#d9741a"],
    description: `A thoughtful gift from the mountains. The hamper contains:

- Seabuckthorn Juice (500 ml)
- Ladakhi Dried Apricots (250 g)
- Apricot Jam (250 g)
- Seabuckthorn Herbal Tea (50 g)`,
    variants: [["1 box", 1300, 1499, 20, 15]],
  },
];

async function main() {
  const reset = process.argv.includes("--reset");
  await prisma.setting.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });

  if (reset) {
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
  } else if ((await prisma.product.count()) > 0) {
    console.log("Store already has products. Skipping sample data (use --reset to replace).");
    return;
  }

  const catIds: Record<string, number> = {};
  for (const [i, c] of categories.entries()) {
    const cat = await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: { ...c, sortOrder: i } });
    catIds[c.slug] = cat.id;
  }

  for (const p of products) {
    const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const [shape, bg, c, c2] = p.image;
    const url = saveImage(`sample-${slug}.svg`, placeholderSvg(p.name.replace(/\s*\(.*\)/, ""), shape, bg, c, c2));
    await prisma.product.create({
      data: {
        name: p.name,
        slug,
        shortDescription: p.short,
        description: p.description,
        categoryId: catIds[p.category],
        isFeatured: Boolean(p.featured),
        images: { create: [{ url, sortOrder: 0 }] },
        variants: {
          create: p.variants.map(([label, weightGrams, price, discountPercent, stock], i) => ({
            label,
            weightGrams,
            price,
            discountPercent,
            stock,
            sortOrder: i,
          })),
        },
      },
    });
  }
  console.log(`Added ${categories.length} categories and ${products.length} sample products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
