import type { NextConfig } from "next";

const headers = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
  // CSP is set per-request (nonce) in proxy.ts
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers }];
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
  // admin product form uploads images through a server action
  experimental: { serverActions: { bodySizeLimit: "160mb" }, proxyClientMaxBodySize: "160mb" },
};

export default nextConfig;
