// Products shown as 3D jars at the top of the home page, in display order.
// `label` is the artwork wrapped around the jar (files live in public/showcase),
// `labelAspect` its width / height, and `fill` what is visible through the glass.
export type JarLook = {
  slug: string;
  label: string;
  labelAspect: number;
  fill: "powder" | "berries";
  fillColor: string;
};

export const SHOWCASE: JarLook[] = [
  { slug: "snow-land-fullers-earth", label: "/showcase/label-1.jpg", labelAspect: 1.502, fill: "powder", fillColor: "#d9c8a9" },
  { slug: "snow-land-fullers-earth-seabuckthorn", label: "/showcase/label-2-v2.jpg", labelAspect: 1.26, fill: "powder", fillColor: "#d7b78b" },
  { slug: "snow-land-seabuckthorn-dry-berry", label: "/showcase/label-3-hd.jpg", labelAspect: 1.239, fill: "berries", fillColor: "#e9761c" },
];

export type ShowcaseProduct = JarLook & {
  name: string;
  shortDescription: string;
  image: string;
  variantId: number;
  weightGrams: number;
  price: number;
  mrp: number;
  stock: number;
};
