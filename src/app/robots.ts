import type { MetadataRoute } from "next";
import { resolveSiteUrl } from "@/lib/site-url";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: new URL("sitemap.xml", resolveSiteUrl()).toString(),
  };
}
