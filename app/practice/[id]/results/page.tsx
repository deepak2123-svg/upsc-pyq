import type { Metadata } from "next";
import { ResultsClient } from "../../../components/results-client";

export const metadata: Metadata = { title: "Practice Results", robots: { index: false, follow: false } };
export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <ResultsClient id={id} />; }
