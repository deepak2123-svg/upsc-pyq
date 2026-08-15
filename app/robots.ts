import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://upscpuraan.vercel.app";
  return { rules: [{ userAgent: "*", allow: ["/", "/exams/", "/subjects/", "/legal/"], disallow: ["/app/", "/admin/", "/api/"] }], sitemap: `${base}/sitemap.xml` };
}
