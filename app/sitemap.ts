import type { MetadataRoute } from "next";
import { PYQ_EXAMS } from "../lib/pyq-catalog";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://upscpuraan.vercel.app";
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    ...PYQ_EXAMS.map((exam) => ({ url: `${base}/exams/${exam}`, changeFrequency: "weekly" as const, priority: 0.9 })),
    { url: `${base}/legal/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/legal/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/legal/sources`, changeFrequency: "monthly", priority: 0.3 },
  ];
}
