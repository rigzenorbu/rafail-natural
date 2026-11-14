/** @type {import('next').NextConfig} */
const nextConfig = {
  // Used only when building the browse-only preview for GitHub Pages (scripts/build-pages.sh).
  basePath: process.env.PAGES_BASE_PATH || undefined,
  distDir: process.env.PAGES_BASE_PATH ? ".next-pages" : ".next",
  typescript: { ignoreBuildErrors: Boolean(process.env.PAGES_BASE_PATH) },
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
    // Allows home-banner videos up to 100 MB to pass through the admin check.
    middlewareClientMaxBodySize: "110mb",
  },
};

export default nextConfig;
