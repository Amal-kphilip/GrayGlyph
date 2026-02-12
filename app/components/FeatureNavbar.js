"use client";

import Image from "next/image";
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
    `inline-flex items-center rounded-xl border px-3.5 py-2 text-xs font-semibold tracking-wide text-[var(--text-primary)] transition-all duration-200 md:px-4 md:py-2 md:text-sm ${
      isActive(href)
        ? "border-[rgba(129,140,248,0.78)] bg-[linear-gradient(135deg,rgba(79,70,229,0.4),rgba(14,116,144,0.22))] shadow-[0_0_0_1px_rgba(129,140,248,0.58),0_0_24px_rgba(91,140,255,0.35),0_10px_24px_rgba(2,6,23,0.42)]"
        : "border-[var(--glass-border)] bg-[linear-gradient(135deg,rgba(30,41,59,0.48),rgba(15,23,42,0.62))] shadow-[0_8px_20px_rgba(2,6,23,0.32)] hover:scale-[1.03] hover:border-[var(--glass-border-strong)] hover:bg-[linear-gradient(135deg,rgba(51,65,85,0.6),rgba(30,41,59,0.7))]"
    } ${mobile ? "w-full justify-start" : ""}`;

  return (
    <header
      className={`relative w-full rounded-[1.6rem] border border-[var(--glass-border-strong)] bg-[linear-gradient(135deg,rgba(2,6,23,0.74),rgba(30,41,59,0.58))] px-3 py-2 shadow-[0_20px_48px_rgba(2,6,23,0.45),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-2xl md:px-5 ${className}`.trim()}
    >
      <div className="flex items-center justify-between gap-2 md:gap-3">
        <Link
          href="/"
          aria-label="GrayGlyph Home"
          className="logo-pill flex items-center py-1.5"
        >
          <Image
            src="/assets/grayglyph-logo.png"
            alt="GrayGlyph"
            width={132}
            height={30}
            className="h-6 w-auto sm:h-7"
            priority
          />
        </Link>

        <button
          type="button"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((prev) => !prev)}
          className={`group inline-flex h-10 w-10 items-center justify-center rounded-xl border bg-[linear-gradient(135deg,rgba(30,41,59,0.58),rgba(15,23,42,0.72))] shadow-[0_8px_20px_rgba(2,6,23,0.35)] backdrop-blur-xl transition duration-200 hover:border-[var(--glass-border-strong)] md:hidden ${
            menuOpen ? "border-[var(--glass-border-strong)]" : "border-[var(--glass-border)]"
          }`}
        >
          <span className="relative h-4 w-5">
            <span
              className={`absolute left-0 top-1/2 h-[2px] w-5 origin-center rounded-full bg-[var(--text-primary)] transform-gpu transition-all duration-300 ease-out ${
                menuOpen ? "-translate-y-1/2 rotate-45" : "-translate-y-[7px]"
              }`}
            />
            <span
              className={`absolute left-0 top-1/2 h-[2px] w-5 origin-center rounded-full bg-[var(--text-primary)] transform-gpu transition-all duration-300 ease-out ${
                menuOpen ? "-translate-y-1/2 scale-x-0 opacity-0" : "-translate-y-1/2 scale-x-100 opacity-100"
              }`}
            />
            <span
              className={`absolute left-0 top-1/2 h-[2px] w-5 origin-center rounded-full bg-[var(--text-primary)] transform-gpu transition-all duration-300 ease-out ${
                menuOpen ? "-translate-y-1/2 -rotate-45" : "translate-y-[5px]"
              }`}
            />
          </span>
        </button>

        <div className="hidden items-center gap-2 rounded-2xl border border-[var(--glass-border)] bg-[rgba(2,6,23,0.38)] p-1 backdrop-blur-xl md:flex">
          <nav aria-label="Primary navigation" className="flex items-center gap-1 text-sm">
            {resolvedLinks.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass(link.href)}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${menuOpen ? "mt-2 max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
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
