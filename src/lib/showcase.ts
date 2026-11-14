// Products shown as 3D jars at the top of the home page, in display order.
// `label` is the artwork wrapped around the jar (files live in public/showcase),
// `labelAspect` its width / height, and `fill` what is visible through the glass.
// `shape` picks the container (the Snow Land jar by default), `band` is the colour of a
// label that wraps all the way round, and `scale` sizes the container against the others
// (chosen so every container stands about as tall as the Snow Land jar).
export type JarLook = {
  slug: string;
  label: string;
  labelAspect: number;
  fill: "powder" | "berries" | "resin" | "pulp";
  fillColor: string;
  shape?: "jar" | "pot" | "bottle";
  band?: string;
  scale?: number;
};

export const SHOWCASE: JarLook[] = [
  { slug: "snow-land-fullers-earth", label: "/showcase/label-1.jpg", labelAspect: 1.502, fill: "powder", fillColor: "#d9c8a9" },
  { slug: "snow-land-fullers-earth-seabuckthorn", label: "/showcase/label-2-v2.jpg", labelAspect: 1.26, fill: "powder", fillColor: "#d7b78b" },
  { slug: "snow-land-seabuckthorn-dry-berry", label: "/showcase/label-3-hd.jpg", labelAspect: 1.239, fill: "berries", fillColor: "#e9761c" },
  { slug: "shilajit", label: "/showcase/label-shilajit.jpg", labelAspect: 1.519, fill: "resin", fillColor: "#1c0d06", shape: "pot", band: "#111111", scale: 0.6 },
  { slug: "sea-buckthorn-pulp", label: "/showcase/label-pulp.jpg", labelAspect: 0.887, fill: "pulp", fillColor: "#f08a1a", shape: "bottle", band: "#fb7f03", scale: 0.355 },
];

export type ShowcaseProduct = JarLook & {
  name: string;
  shortDescription: string;
  image: string;
  variantId: number;
  sizeLabel: string;
  weightGrams: number;
  price: number;
  mrp: number;
  stock: number;
};
