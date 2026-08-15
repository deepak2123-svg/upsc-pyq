import Link from "next/link";

export const metadata = { title: "Privacy policy", description: "How UPSCPuraan handles account and attempt data." };

export default function PrivacyPage() {
  return <article className="public-article"><div className="eyebrow">Legal</div><h1>Privacy policy</h1><p>UPSCPuraan collects only the information needed to provide test attempts, optional account sync, saved tests, and performance analysis.</p><h2>What we store</h2><p>Anonymous sessions use a short-lived guest identifier. If you sign in with Google, we store your email, display name, attempts, answers, saved recipes, and results.</p><h2>What we do not do</h2><p>We do not sell student data or use private attempts for public rankings. Published question provenance is kept separately from personal performance data.</p><h2>Contact</h2><p>For account or content requests, contact the UPSCPuraan team through the project’s published support address.</p><p><Link href="/">Return home →</Link></p></article>;
}
