"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/grayscale", label: "Grayscale" },
  { href: "/color-grade-lut", label: "Color grade" }
];

export default function FeatureNavbar() {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const active = (href) => href === "/"
    ? pathname === "/"
    : href === "/color-grade-lut"
      ? pathname.startsWith("/color-grade-lut") || pathname.startsWith("/color-transfer")
      : pathname.startsWith(href);

  return (
    <header className="editorial-nav">
      <Link href="/" className="wordmark" aria-label="GrayGlyph home"><span className="wordmark-mark">G<span>.</span></span><span className="wordmark-name">GRAYGLYPH</span></Link>
      <nav className="desktop-nav" aria-label="Primary navigation">
        {LINKS.map((link) => <Link href={link.href} key={link.href} className={`nav-link${active(link.href) ? " is-active" : ""}`}>{link.label}<span className="nav-link-arrow">↗</span></Link>)}
      </nav>
      <Link className="nav-contact" href="/contact">GET IN TOUCH <ArrowUpRight size={15} /></Link>
      <button className="mobile-menu-toggle" type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X size={21} /> : <Menu size={21} />}</button>
      {open && <nav className="mobile-nav" aria-label="Mobile navigation">{LINKS.map((link) => <Link href={link.href} key={link.href} className={active(link.href) ? "is-active" : ""}>{link.label}<ArrowUpRight size={17} /></Link>)}<Link href="/contact">Contact<ArrowUpRight size={17} /></Link></nav>}
    </header>
  );
}
