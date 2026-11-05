import type { MetadataRoute } from "next";
import { profile } from "@/data/profile";

// Required with `output: "export"`: generate this file once at build time.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${profile.siteUrl}/`,
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
