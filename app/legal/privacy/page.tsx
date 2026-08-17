import Link from "next/link";
import { SiteHeader } from "../../components/site-header";

export const metadata = { title: "Privacy policy", description: "How UPSC.PYQ.Practise handles device-local practice data." };
export default function PrivacyPage() {
  return <><SiteHeader /><article className="public-article"><div className="eyebrow">Legal</div><h1>Privacy policy</h1><p>UPSC.PYQ.Practise does not require a student account. Attempts, answers and bookmarks are stored only in this browser.</p><h2>What reaches the server</h2><p>The website receives ordinary requests needed to load questions and verify answers. Student practice history is not attached to an identity or synchronised to an account.</p><h2>Your controls</h2><p>You can export or clear all locally stored practice data from the Attempts page. Clearing browser storage also removes it.</p><h2>Editorial access</h2><p>Staff authentication is limited to the separate editorial system and is not part of student practice.</p><p><Link href="/">Return to PYQs →</Link></p></article></>;
}
