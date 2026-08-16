import type { Metadata } from "next";
import { PracticeClient } from "../../components/practice-client";

export const metadata: Metadata = { title: "PYQ Practice", robots: { index: false, follow: false } };
export default async function PracticePage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <PracticeClient id={id} />; }
