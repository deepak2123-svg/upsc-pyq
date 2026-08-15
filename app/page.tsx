import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "UPSC Test Series & PYQ Practice | UPSCPuraan",
  description:
    "Build focused UPSC CSE, CAPF, CDS and NDA tests from verified PYQs and reviewed MCQs.",
};

export default function Home() {
  return (
    <main className="public-shell">
      <nav className="public-nav" aria-label="Public navigation">
        <Link className="brand public-brand" href="/"> <span className="brand-mark">U</span> UPSCPuraan</Link>
        <div className="public-nav-links"><Link href="/exams/CSE">Exams</Link><Link href="/subjects/Geography">Subjects</Link><Link href="/legal/sources">Sources</Link><Link className="primary" href="/app">Open test lab →</Link></div>
      </nav>
      <section className="public-hero">
        <div>
          <div className="eyebrow">UPSC test lab · free beta</div>
          <h1>Your syllabus.<br />Your test.</h1>
          <p>Build a focused paper from exact previous-year questions, practise with intent, and see where your preparation needs attention.</p>
          <div className="public-actions"><Link className="primary" href="/app">Build a test →</Link><Link className="secondary" href="/exams/CSE">Explore the catalogue</Link></div>
        </div>
        <aside className="public-proof"><strong>Built for serious practice</strong><span>Exact PYQ wording</span><span>Exam and Practice modes</span><span>Subject and difficulty control</span><span>Editorially reviewed content</span></aside>
      </section>
      <section className="public-grid" aria-label="Product principles">
        <article><span className="public-number">01</span><h2>Choose your ingredients</h2><p>Pick an examination, subject, difficulty, length, and pace. All subjects and all types are always available.</p></article>
        <article><span className="public-number">02</span><h2>Attempt without friction</h2><p>No sign-in is required to start. Optional Google login will sync your history across devices.</p></article>
        <article><span className="public-number">03</span><h2>Improve with evidence</h2><p>Review solutions, subject breakdowns, and weak areas from a question bank built for auditability.</p></article>
      </section>
      <footer className="public-footer"><span>Independent preparation platform. Not affiliated with UPSC.</span><span><Link href="/legal/privacy">Privacy</Link> · <Link href="/legal/terms">Terms</Link> · <Link href="/legal/sources">Sources</Link></span></footer>
    </main>
  );
}
