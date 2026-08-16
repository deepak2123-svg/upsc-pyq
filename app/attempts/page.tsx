import type { Metadata } from "next";
import { SiteHeader } from "../components/site-header";
import { AttemptsLibrary } from "../components/local-library";

export const metadata: Metadata = { title: "Attempts", robots: { index: false, follow: false } };
export default function AttemptsPage() { return <><SiteHeader /><AttemptsLibrary /></>; }
