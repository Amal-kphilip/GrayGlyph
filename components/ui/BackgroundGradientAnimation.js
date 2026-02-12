"use client";

import { usePathname } from "next/navigation";

const blobPerfStyle = {
  contain: "paint",
  backfaceVisibility: "hidden",
  willChange: "transform"
};

export default function BackgroundGradientAnimation() {
  const pathname = usePathname();
  const isEditorRoute = pathname?.startsWith("/editor");
  const opacityScale = isEditorRoute ? 0.92 : 1;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{ contain: "paint" }}
    >
      <div className="absolute inset-0 gradient-base" />

      <div
        className="gradient-blob animate-first absolute -left-24 -top-20 h-[420px] w-[420px] rounded-full blur-[86px] sm:-left-40 sm:-top-36 sm:h-[640px] sm:w-[640px] sm:blur-[120px]"
        style={{
          ...blobPerfStyle,
          opacity: 0.72 * opacityScale,
          transformOrigin: "50% 50%",
          background: "radial-gradient(circle at 30% 30%, var(--blob-blue) 0%, transparent 68%)"
        }}
      />

      <div
        className="gradient-blob animate-second absolute -right-20 bottom-[-60px] h-[360px] w-[360px] rounded-full blur-[86px] sm:-right-36 sm:bottom-[-120px] sm:h-[540px] sm:w-[540px] sm:blur-[120px]"
        style={{
          ...blobPerfStyle,
          opacity: 0.68 * opacityScale,
          transformOrigin: "calc(50% - 260px) calc(50% - 180px)",
          background: "radial-gradient(circle at 32% 30%, var(--blob-indigo) 0%, transparent 68%)"
        }}
      />

      <div
        className="gradient-blob animate-third absolute left-[46%] top-[36%] h-[300px] w-[300px] rounded-full blur-[80px] sm:left-[42%] sm:top-[32%] sm:h-[460px] sm:w-[460px] sm:blur-[120px]"
        style={{
          ...blobPerfStyle,
          opacity: 0.62 * opacityScale,
          transformOrigin: "calc(50% + 220px) calc(50% + 180px)",
          background: "radial-gradient(circle at 34% 36%, var(--blob-cyan) 0%, transparent 70%)"
        }}
      />

      <div
        className="gradient-blob animate-fourth absolute hidden sm:block sm:left-[-22%] sm:top-[48%] sm:h-[340px] sm:w-[1250px] sm:rounded-full sm:blur-[120px]"
        style={{
          ...blobPerfStyle,
          opacity: 0.54 * opacityScale,
          background: "radial-gradient(ellipse at 40% 52%, var(--blob-blue) 0%, transparent 74%)"
        }}
      />

      <div
        className="gradient-blob animate-fifth absolute right-[4%] top-[8%] h-[260px] w-[260px] rounded-full blur-[76px] sm:right-[10%] sm:h-[420px] sm:w-[420px] sm:blur-[120px]"
        style={{
          ...blobPerfStyle,
          opacity: 0.58 * opacityScale,
          transformOrigin: "calc(50% - 180px) calc(50% + 240px)",
          background: "radial-gradient(circle at 34% 36%, var(--blob-indigo) 0%, transparent 70%)"
        }}
      />
    </div>
  );
}
