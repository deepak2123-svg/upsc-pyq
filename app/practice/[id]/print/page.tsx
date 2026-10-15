import type { Metadata } from "next";
import { PrintPaperClient } from "../../../components/print-paper-client";

export const metadata: Metadata = { title: "Printable PYQ Paper", robots: { index: false, follow: false } };
export default async function PrintPaperPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <PrintPaperClient id={id} />; }
