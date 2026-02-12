"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const DEFAULT_LINKS = [
  { href: "/", label: "Home" },
  { href: "/grayscale", label: "Grayscale" },
  { href: "/editor", label: "Photo Editor" },
  { href: "/color-transfer", label: "Color Grade" }
];

export default function FeatureNavbar({ links = [], className = "" }) {
  const pathname = usePathname() || "/";
  const [menuOpen, setMenuOpen] = useState(false);

  const resolvedLinks = (() => {
    const merged = new Map(DEFAULT_LINKS.map((link) => [link.href, link]));

    links.forEach((link) => {
      if (!link?.href || !link?.label) {
        return;
      }
      merged.set(link.href, { href: link.href, label: link.label });
    });

    return [...merged.values()];
  })();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const isActive = (href) => {
    if (href === "/") {
      return pathname === "/";
    }
    if (href === "/color-transfer") {
      return pathname === "/color-transfer" || pathname.startsWith("/color-transfer/") || pathname === "/color-grade-lut" || pathname.startsWith("/color-grade-lut/");
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const linkClass = (href, mobile = false) =>
    `rounded-full border px-3.5 py-1.5 text-xs font-semibold tracking-wide text-[var(--text-primary)] transition duration-200 md:px-4 md:py-1.5 md:text-sm ${
      isActive(href)
        ? "border-[rgba(129,140,248,0.82)] bg-[linear-gradient(135deg,rgba(67,56,202,0.46),rgba(30,41,59,0.72))] shadow-[0_0_0_1px_rgba(129,140,248,0.6),0_0_24px_rgba(91,140,255,0.38),0_8px_20px_rgba(2,6,23,0.45)]"
        : "border-[var(--glass-border)] bg-[linear-gradient(135deg,rgba(30,41,59,0.52),rgba(15,23,42,0.58))] shadow-[0_8px_20px_rgba(2,6,23,0.35)] hover:-translate-y-px hover:border-[var(--glass-border-strong)] hover:bg-[linear-gradient(135deg,rgba(51,65,85,0.62),rgba(30,41,59,0.72))]"
    } ${mobile ? "w-full text-left" : ""}`;

  return (
    <header
      className={`relative w-full rounded-[1.8rem] border border-[var(--glass-border-strong)] bg-[linear-gradient(135deg,rgba(15,23,42,0.78),rgba(30,41,59,0.62))] px-3 py-2 shadow-[0_16px_40px_rgba(2,6,23,0.45),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-2xl md:px-5 ${className}`.trim()}
    >
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/"
          aria-label="GrayGlyph Home"
          className="logo-pill py-1.5"
        >
          GrayGlyph.
        </Link>

        <button
          type="button"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((prev) => !prev)}
          className="group inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--glass-border)] bg-[linear-gradient(135deg,rgba(30,41,59,0.58),rgba(15,23,42,0.72))] shadow-[0_8px_20px_rgba(2,6,23,0.35)] backdrop-blur-xl transition duration-200 hover:border-[var(--glass-border-strong)] md:hidden"
        >
          <span className="relative h-3.5 w-4">
            <span className={`absolute left-0 top-0 h-[2px] w-4 rounded-full bg-[var(--text-primary)] transition duration-300 ${menuOpen ? "translate-y-[6px] rotate-45" : ""}`} />
            <span className={`absolute left-0 top-[6px] h-[2px] w-4 rounded-full bg-[var(--text-primary)] transition duration-300 ${menuOpen ? "opacity-0" : "opacity-100"}`} />
            <span className={`absolute left-0 top-[12px] h-[2px] w-4 rounded-full bg-[var(--text-primary)] transition duration-300 ${menuOpen ? "-translate-y-[6px] -rotate-45" : ""}`} />
          </span>
        </button>

        <div className="hidden items-center gap-1.5 rounded-full border border-[var(--glass-border)] bg-[rgba(2,6,23,0.35)] p-1 backdrop-blur-xl md:flex">
          <nav className="flex items-center gap-1 text-sm">
            {resolvedLinks.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass(link.href)}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${menuOpen ? "mt-2 max-h-72 opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="rounded-2xl border border-[var(--glass-border)] bg-[rgba(2,6,23,0.44)] p-2 backdrop-blur-xl">
          <nav className="grid gap-1.5">
            {resolvedLinks.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`${linkClass(link.href, true)} ${menuOpen ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"} transition duration-300`}
                style={{ transitionDelay: `${menuOpen ? index * 35 : 0}ms` }}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
