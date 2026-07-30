import Link from "next/link";
import { LEGAL_EFFECTIVE_DATE, LEGAL_LINKS, LEGAL_VERSION } from "@/lib/legal";

export type LegalTocItem = { id: string; label: string };

export function LegalPageShell({
  title,
  introduction,
  toc,
  children,
}: {
  title: string;
  introduction: string;
  toc: LegalTocItem[];
  children: React.ReactNode;
}) {
  return (
    <>
      <a className="legal-skip" href="#legal-content">Skip to legal document</a>
      <div className="legal-page">
        <header className="legal-masthead">
          <Link href="/" className="legal-brand" aria-label="UntapGo home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" width="36" height="36" alt="" />
            <span>UntapGo</span>
          </Link>
          <Link href="/" className="legal-back">Back to UntapGo</Link>
        </header>

        <div className="legal-title">
          <p className="legal-kicker">Legal · Version {LEGAL_VERSION}</p>
          <h1>{title}</h1>
          <p className="legal-intro">{introduction}</p>
          <dl className="legal-dates">
            <div><dt>Effective</dt><dd>{LEGAL_EFFECTIVE_DATE}</dd></div>
            <div><dt>Last updated</dt><dd>{LEGAL_EFFECTIVE_DATE}</dd></div>
          </dl>
        </div>

        <details className="legal-mobile-toc">
          <summary>On this page</summary>
          <LegalTableOfContents items={toc} />
        </details>

        <div className="legal-grid">
          <aside className="legal-desktop-toc">
            <LegalTableOfContents items={toc} />
          </aside>
          <article id="legal-content" className="legal-article">{children}</article>
        </div>

        <nav className="legal-document-links" aria-label="Legal documents">
          <h2>UntapGo legal documents</h2>
          <div>{LEGAL_LINKS.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}</div>
          <Link href="/legal">Legal overview</Link>
        </nav>
      </div>
    </>
  );
}

export function LegalTableOfContents({ items }: { items: LegalTocItem[] }) {
  return (
    <nav aria-label="Table of contents">
      <p>On this page</p>
      <ol>{items.map((item) => <li key={item.id}><a href={`#${item.id}`}>{item.label}</a></li>)}</ol>
    </nav>
  );
}

export function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return <section id={id} className="legal-section"><h2>{title}</h2>{children}</section>;
}

