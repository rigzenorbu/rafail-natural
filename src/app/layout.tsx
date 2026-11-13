import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Rafail Natural – Natural Products from Ladakh", template: "%s | Rafail Natural" },
  description:
    "Shop natural Ladakhi products: seabuckthorn, apricots, apples, herbal teas and more. Sourced from Ladakh, delivered across India.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
