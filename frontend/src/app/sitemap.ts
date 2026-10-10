import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!baseUrl) {
    return [];
  }

  return ["/", "/explore", "/contact", "/privacy", "/terms"].map((path) => ({
    url: `${baseUrl.replace(/\/$/, "")}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "/" || path === "/explore" ? "daily" : "yearly",
    priority: path === "/" ? 1 : 0.6,
  }));
}
