/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
    // Allows home-banner videos up to 100 MB to pass through the admin check.
    middlewareClientMaxBodySize: "110mb",
  },
};

export default nextConfig;
