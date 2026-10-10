import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/explore", "/events/"],
      disallow: ["/api/", "/checkout/", "/profile", "/organizer"],
    },
  };
}
