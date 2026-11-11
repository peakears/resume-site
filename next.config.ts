import type { NextConfig } from "next";
import { profile } from "./src/data/profile";
import { basePathOf } from "./src/lib/basePath";

const nextConfig: NextConfig = {
  // Static export: `next build` emits plain HTML/CSS/JS into `out/`,
  // so the site can be hosted on any static host for free.
  output: "export",
  // Served at patrickkearney.dev/resume, next to the hub and other sections.
  // Derived from profile.siteUrl so the URL is set in one place.
  basePath: basePathOf(profile.siteUrl),
  // Default image optimization needs a server; static export can't use it.
  images: { unoptimized: true },
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
