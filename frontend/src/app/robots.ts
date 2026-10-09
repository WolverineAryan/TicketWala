import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ticketwala.org";

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/home", "/explore", "/events", "/simulation", "/contact", "/privacy", "/terms"],
      disallow: ["/checkout/", "/profile", "/organizer"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
