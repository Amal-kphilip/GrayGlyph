import Link from "next/link";
import { ArrowUpRight, Check, Github, Instagram, Linkedin } from "lucide-react";

const TOOLS = [
  { href: "/grayscale", label: "Grayscale studio" },
  { href: "/color-grade-lut", label: "Color grade transfer" }
];
const RESOURCES = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/faq", label: "FAQ" },
  { href: "/privacy-policy", label: "Privacy policy" },
  { href: "/terms-of-service", label: "Terms of service" },
  { href: "/contact", label: "Contact" }
];
const SOCIALS = [
  { href: "https://www.linkedin.com/in/amal-k-philip/", label: "LinkedIn", Icon: Linkedin },
  { href: "https://github.com/Amal-kphilip", label: "GitHub", Icon: Github },
  { href: "https://www.instagram.com/amalkp29/", label: "Instagram", Icon: Instagram },
  { href: "https://x.com/AmalkPhilip", label: "X", Icon: null }
];

export default function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer" aria-label="Site footer">
      <div className="footer-main">
        <section className="footer-brand">
          <Link href="/" className="wordmark" aria-label="GrayGlyph home"><span className="wordmark-mark">G<span>.</span></span><span className="wordmark-name">GRAYGLYPH</span></Link>
          <p className="footer-brand-copy">Two considered image tools for timeless monochrome and cinematic colour. Private, browser-based, and made for the details.</p>
          <div className="footer-trust"><span><Check size={13} /> No uploads</span><span><Check size={13} /> No tracking</span><span><Check size={13} /> Local processing</span></div>
        </section>
        <nav className="footer-column" aria-label="Image tools"><h3>THE TOOLS</h3><ul>{TOOLS.map((link) => <li key={link.href}><Link href={link.href}>{link.label}<ArrowUpRight size={12} /></Link></li>)}</ul></nav>
        <nav className="footer-column" aria-label="Resources"><h3>RESOURCES</h3><ul>{RESOURCES.map((link) => <li key={link.href}><Link href={link.href}>{link.label}</Link></li>)}</ul></nav>
        <section className="footer-column"><h3>ELSEWHERE</h3><ul>{SOCIALS.map(({ href, label, Icon }) => <li key={label}><a href={href} target="_blank" rel="noreferrer noopener">{Icon ? <Icon size={14} /> : <span className="social-x">𝕏</span>}{label}<ArrowUpRight size={11} /></a></li>)}</ul></section>
      </div>
      <div className="footer-bottom"><span>© {year} GRAYGLYPH / IMAGE TOOLS FOR CREATORS</span><span>YOUR FILES STAY YOURS.</span><div className="footer-socials">{SOCIALS.map(({ href, label, Icon }) => <a key={label} href={href} target="_blank" rel="noreferrer noopener" aria-label={label}>{Icon ? <Icon size={14} /> : <span className="social-x">𝕏</span>}</a>)}</div></div>
    </footer>
  );
}
