import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
  // admin product form uploads images through a server action
  experimental: { serverActions: { bodySizeLimit: "10mb" } },
};

export default nextConfig;
