import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // OLD (deprecated):
    // domains: ["res.cloudinary.com"],

    // NEW:
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",        // default HTTPS port
        pathname: "/**", // allow all paths under res.cloudinary.com
      },
      // …add more patterns here if you need to whitelist other hosts
    ],
  },
};

export default nextConfig;
