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
          <label className="sr-only" htmlFor="pyq-term">PYQ term</label>
          <input id="pyq-term" name="q" type="search" defaultValue={searchQuery} maxLength={160} placeholder="Search any PYQ term" autoComplete="off" />
          <button type="submit" aria-label="Search PYQs">Search</button>
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
