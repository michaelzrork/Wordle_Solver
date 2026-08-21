import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The word lists never change between deploys, so let the CDN keep them.
  async headers() {
    return [
      {
        source: "/wordlists/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600, s-maxage=86400, immutable" }],
      },
    ];
  },
};

export default nextConfig;
