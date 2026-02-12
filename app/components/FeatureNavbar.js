import Link from "next/link";

export default function FeatureNavbar({ links = [], className = "" }) {
  const resolvedLinks = [{ href: "/", label: "Home" }, ...links].filter(
    (link, index, all) => all.findIndex((item) => item.href === link.href) === index
  );

  return (
    <header
      className={`relative flex flex-wrap items-center justify-between gap-2 rounded-full border border-[var(--glass-border-strong)] bg-[linear-gradient(135deg,rgba(15,23,42,0.78),rgba(30,41,59,0.62))] px-3 py-2 shadow-[0_16px_40px_rgba(2,6,23,0.45),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-2xl md:px-5 ${className}`.trim()}
    >
      <Link
        href="/"
        aria-label="GrayGlyph Home"
        className="logo-pill py-1.5"
      >
        GrayGlyph.
      </Link>
      <div className="flex items-center gap-1.5 rounded-full border border-[var(--glass-border)] bg-[rgba(2,6,23,0.35)] p-1 backdrop-blur-xl">
        <nav className="flex items-center gap-1 text-sm">
          {resolvedLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-[var(--glass-border)] bg-[linear-gradient(135deg,rgba(30,41,59,0.52),rgba(15,23,42,0.58))] px-3.5 py-1.5 text-xs font-semibold tracking-wide text-[var(--text-primary)] shadow-[0_8px_20px_rgba(2,6,23,0.35)] transition duration-200 hover:-translate-y-px hover:border-[var(--glass-border-strong)] hover:bg-[linear-gradient(135deg,rgba(51,65,85,0.62),rgba(30,41,59,0.72))] md:px-4 md:py-1.5 md:text-sm"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
