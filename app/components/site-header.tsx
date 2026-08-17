import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="pyq-header">
      <div className="pyq-header-inner">
        <Link className="pyq-brand" href="/" aria-label="UPSC.PYQ.Practise home">
          <span className="pyq-brand-mark" aria-hidden="true">PYQ</span>
          <span>UPSC.PYQ.Practise</span>
        </Link>
        <nav className="pyq-nav" aria-label="Primary navigation">
          <Link href="/">PYQs</Link>
          <Link href="/attempts">Attempts</Link>
          <Link href="/bookmarks">Bookmarks</Link>
        </nav>
      </div>
    </header>
  );
}
