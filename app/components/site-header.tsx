import Link from "next/link";

export function SiteHeader({searchQuery=""}:{searchQuery?:string}) {
  return (
    <header className="pyq-header">
      <div className="pyq-header-inner">
        <Link className="pyq-brand" href="/" aria-label="UPSC.PYQ.Practise home">
          <span className="pyq-brand-mark" aria-hidden="true">PYQ</span>
          <span>UPSC.PYQ.Practise</span>
        </Link>
        <form className="pyq-header-search" action="/" method="get" role="search">
          <input id="pyq-term" aria-label="PYQ term" name="q" type="search" defaultValue={searchQuery} maxLength={160} placeholder="Search PYQs" autoComplete="off" />
          <button type="submit" aria-label="Search PYQs"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg></button>
        </form>
        <nav className="pyq-nav" aria-label="Primary navigation">
          <Link href="/">PYQs</Link>
          <Link href="/attempts">Attempts</Link>
          <Link href="/bookmarks">Bookmarks</Link>
          <Link href="/legal/sources">Sources</Link>
        </nav>
      </div>
    </header>
  );
}
