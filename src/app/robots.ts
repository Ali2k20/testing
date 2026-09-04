import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/checkout", "/cart", "/order-confirmed", "/wishlist"],
    },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
