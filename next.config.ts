import type { NextConfig } from "next";

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL) : null;

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    // Imágenes subidas desde el panel a Supabase Storage.
    remotePatterns: supabase ? [{ protocol: "https", hostname: supabase.hostname, pathname: "/storage/v1/object/public/**" }] : [],
  },
};

export default nextConfig;
