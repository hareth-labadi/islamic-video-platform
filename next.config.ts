import type { NextConfig } from "next";

/** Let next/image load media served by the backend (thumbnails, short posters, photos). */
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const remotePatterns: NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]> = [];
if (apiUrl) {
  try {
    const u = new URL(apiUrl);
    remotePatterns.push({ protocol: u.protocol.replace(":", "") as "http" | "https", hostname: u.hostname, port: u.port, pathname: "/**" });
  } catch {
    // Ignore an invalid NEXT_PUBLIC_API_URL; next/image just won't allow that host.
  }
}

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  images: { remotePatterns },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
