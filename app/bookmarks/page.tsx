import type { Metadata } from "next";
import { SiteHeader } from "../components/site-header";
import { BookmarksLibrary } from "../components/local-library";

export const metadata: Metadata = { title: "Bookmarks", robots: { index: false, follow: false } };
export default function BookmarksPage() { return <><SiteHeader /><BookmarksLibrary /></>; }
