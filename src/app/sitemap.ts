import type { MetadataRoute } from "next";
import { collections } from "@/lib/collections";
import { products } from "@/lib/products";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes = [
    { path: "", priority: 1 },
    { path: "/shop", priority: 0.9 },
    { path: "/collections", priority: 0.8 },
    { path: "/about", priority: 0.6 },
    { path: "/size-guide", priority: 0.6 },
    { path: "/shipping-and-returns", priority: 0.5 },
    { path: "/fabric-care", priority: 0.5 },
    { path: "/faq", priority: 0.5 },
    { path: "/contact", priority: 0.5 },
  ].map((route) => ({
    url: `${site.url}${route.path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: route.priority,
  }));

  return [
    ...staticRoutes,
    ...collections.map((collection) => ({
      url: `${site.url}/collections/${collection.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...products.map((product) => ({
      url: `${site.url}/product/${product.slug}`,
      lastModified: new Date(product.releasedAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
