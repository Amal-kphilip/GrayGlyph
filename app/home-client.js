import Image from "next/image";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Check, CircleArrowRight, Fingerprint, Image as ImageIcon, Layers3, MoveUpRight, Palette, ShieldCheck, Sparkles } from "lucide-react";
import FeatureNavbar from "./components/FeatureNavbar";

const tools = [
  {
    number: "01",
    eyebrow: "MONOCHROME STUDIO",
    title: "Grayscale,\nwith feeling.",
    description: "Turn ordinary photographs into considered black-and-white images. Tune intensity, contrast, brightness and film grain, then compare every detail before export.",
    href: "/grayscale",
    action: "Open grayscale studio",
    icon: ImageIcon,
    tag: "TONAL CONTROL",
    className: "tool-tile--mono"
  },
  {
    number: "02",
    eyebrow: "CINEMATIC COLOUR",
    title: "One look.\nA whole new mood.",
    description: "Borrow the colour character of a reference image and apply it to another photo with an adjustable 3D LUT workflow—all in your browser.",
    href: "/color-grade-lut",
    action: "Open colour grade studio",
    icon: Palette,
    tag: "3D LUT TRANSFER",
    className: "tool-tile--grade"
  }
];

const principles = [
  { icon: ShieldCheck, title: "Private by default", text: "Your images stay on your device. Processing happens in the browser." },
  { icon: Layers3, title: "Built for comparison", text: "Adjust the result and compare it with the original as you work." },
  { icon: Fingerprint, title: "No account required", text: "Open a tool, bring an image, and get straight to the work." }
];


function ArtworkPreview() {
  return (
    <div className="hero-artwork" aria-label="Preview of GrayGlyph's image tools">
      <div className="artwork-red-block" />
      <div className="artwork-index">GG / 026 <span>IMAGE WORKFLOW</span></div>
      <div className="artwork-photo artwork-photo--colour">
        <Image fill unoptimized priority sizes="(max-width: 768px) 70vw, 520px" src="/assets/sample-image.png" alt="Portrait photo in colour" />
        <span className="artwork-label">ORIGINAL / RGB</span>
      </div>
      <div className="artwork-photo artwork-photo--mono">
        <Image fill unoptimized sizes="(max-width: 768px) 58vw, 420px" src="/assets/sample-image.png" alt="The same portrait shown in black and white" />
        <span className="artwork-label">STUDY / B&amp;W</span>
      </div>
      <div className="artwork-stamp"><Sparkles size={16} strokeWidth={1.8} /><span>YOUR IMAGE.<br />YOUR VISION.</span></div>
      <div className="artwork-caption"><span>FIG. 01</span><span>IMAGE TRANSFORMATION, REIMAGINED.</span></div>
    </div>
  );
}

export default function HomeClient() {
  return (
    <main className="editorial-shell home-page">
      <FeatureNavbar />

      <section className="home-hero">
        <div className="home-hero-copy">
          <p className="eyebrow"><span className="eyebrow-dot" /> PRIVACY-FIRST IMAGE TOOLS</p>
          <h1>MAKE IT<br />MONOCHROME<span className="red-star">✳</span><br /><span className="hero-last-line">MAKE IT <span className="red-word">CINEMATIC.</span></span></h1>
          <p className="home-hero-description">Two focused tools for the way an image feels. Shape timeless black and white, or move colour from one photograph to another.</p>
          <div className="hero-actions">
            <Link href="/grayscale" className="button-red">START WITH GRAYSCALE <ArrowUpRight size={17} /></Link>
            <Link href="/color-grade-lut" className="text-link">EXPLORE COLOUR GRADE <MoveUpRight size={16} /></Link>
          </div>
          <div className="hero-meta"><span>01 / TWO PURPOSE-BUILT TOOLS</span><span>PROCESS LOCALLY · EXPORT FREELY</span></div>
        </div>
        <ArtworkPreview />
      </section>

      <section className="stats-strip" aria-label="GrayGlyph principles">
        <div><strong>02</strong><span>FOCUSED TOOLS</span></div>
        <div><strong>100<span>%</span></strong><span>BROWSER-BASED</span></div>
        <div><strong>0</strong><span>IMAGE UPLOADS</span></div>
        <div className="stats-strip-note"><span>LESS INTERFACE.</span><span>MORE INTENTION.</span></div>
      </section>

      <section className="tools-section" id="tools">
        <div className="section-heading-row">
          <div><p className="eyebrow">THE TOOLKIT / 02</p><h2>Make every pixel<br /><span>earn its place.</span></h2></div>
          <p className="section-heading-note">No bloated suite. No cluttered workspace. Just the tools you came for.</p>
        </div>
        <div className="tool-tiles">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <article className={`tool-tile ${tool.className}`} key={tool.number}>
                <div className="tool-tile-top"><span>{tool.number} / {tool.eyebrow}</span><span className="tool-tile-icon"><Icon size={19} strokeWidth={1.7} /></span></div>
                <div className="tile-visual" aria-hidden="true">
                  {tool.number === "01" ? (
                    <div className="mono-visual"><Image fill unoptimized sizes="(max-width: 768px) 70vw, 480px" src="/assets/sample-image.png" alt="" /><span className="mono-visual-half" /><span className="visual-divider" /><span className="visual-badge">B&amp;W / 100%</span></div>
                  ) : (
                    <div className="grade-visual"><div className="grade-swatch grade-swatch--one" /><div className="grade-swatch grade-swatch--two" /><div className="grade-swatch grade-swatch--three" /><div className="grade-swatch grade-swatch--four" /><div className="grade-visual-caption">COLOUR<br />IS A LANGUAGE<span>↗</span></div></div>
                  )}
                </div>
                <p className="tile-tag">{tool.tag}</p>
                <h3>{tool.title.split("\n").map((line) => <span key={line}>{line}<br /></span>)}</h3>
                <p className="tool-tile-description">{tool.description}</p>
                <Link href={tool.href} className="tile-action">{tool.action}<CircleArrowRight size={23} strokeWidth={1.5} /></Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className="privacy-section">
        <div className="privacy-mark"><ShieldCheck size={27} strokeWidth={1.5} /><span>BUILT AROUND<br />YOUR PRIVACY</span></div>
        <div className="privacy-copy"><p className="eyebrow">YOUR FILES STAY YOURS</p><h2>Private by design.<br /><span>Not by promise.</span></h2><p>GrayGlyph processes images on your device. Your source images are not sent to a server just to use the tools. You stay in control from first preview to final export.</p></div>
        <div className="privacy-list">{principles.map(({ icon: Icon, title, text }, index) => <div className="privacy-item" key={title}><span className="privacy-item-number">0{index + 1}</span><span className="privacy-item-icon"><Icon size={19} /></span><div><h3>{title}</h3><p>{text}</p></div><Check size={17} className="privacy-check" /></div>)}</div>
      </section>

      <section className="closing-cta"><div><p className="eyebrow">YOUR NEXT IMAGE STARTS HERE</p><h2>SEE IT<br />DIFFERENTLY<span>.</span></h2></div><Link href="/grayscale" className="closing-cta-link">LET&apos;S MAKE SOMETHING<br />OUT OF THE ORDINARY <ArrowDownRight size={28} /></Link><div className="closing-cta-index">GRAYGLYPH / IMAGE TOOLS / 2026</div></section>
    </main>
  );
}
