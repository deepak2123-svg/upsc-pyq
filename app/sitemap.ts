import type { MetadataRoute } from "next";
import { catalogExams, catalogSubjects } from "../lib/catalog";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://upscpuraan.vercel.app";
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    ...Object.keys(catalogExams).map((exam) => ({ url: `${base}/exams/${exam}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...catalogSubjects.map((subject) => ({ url: `${base}/subjects/${encodeURIComponent(subject)}`, changeFrequency: "monthly" as const, priority: 0.6 })),
    { url: `${base}/legal/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/legal/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/legal/sources`, changeFrequency: "monthly", priority: 0.3 },
  ];
}
