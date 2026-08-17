import Link from "next/link";
import { SiteHeader } from "../../components/site-header";

export const metadata = { title: "Terms of use", description: "Terms for using UPSC.PYQ.Practise." };
export default function TermsPage() {
  return <><SiteHeader /><article className="public-article"><div className="eyebrow">Legal</div><h1>Terms of use</h1><p>UPSC.PYQ.Practise is an independent preparation platform. It is not affiliated with, endorsed by, or connected to the Union Public Service Commission.</p><h2>Content</h2><p>Previous-year question wording and source metadata are retained for study and attribution. Report suspected answer, source, or copyright issues for editorial review.</p><h2>Practice results</h2><p>Practice results are educational records stored on your device and are not official examination results.</p><p><Link href="/">Return to PYQs →</Link></p></article></>;
}
