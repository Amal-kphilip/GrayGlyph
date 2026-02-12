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
        className="gradient-blob animate-first absolute -left-40 -top-36 h-[640px] w-[640px] rounded-full blur-[120px]"
        style={{
          ...blobPerfStyle,
          opacity: 0.72 * opacityScale,
          transformOrigin: "50% 50%",
          background: "radial-gradient(circle at 30% 30%, var(--blob-blue) 0%, transparent 68%)"
        }}
      />

      <div
        className="gradient-blob animate-second absolute -right-36 bottom-[-120px] h-[540px] w-[540px] rounded-full blur-[120px]"
        style={{
          ...blobPerfStyle,
          opacity: 0.68 * opacityScale,
          transformOrigin: "calc(50% - 260px) calc(50% - 180px)",
          background: "radial-gradient(circle at 32% 30%, var(--blob-indigo) 0%, transparent 68%)"
        }}
      />

      <div
        className="gradient-blob animate-third absolute left-[42%] top-[32%] h-[460px] w-[460px] rounded-full blur-[120px]"
        style={{
          ...blobPerfStyle,
          opacity: 0.62 * opacityScale,
          transformOrigin: "calc(50% + 220px) calc(50% + 180px)",
          background: "radial-gradient(circle at 34% 36%, var(--blob-cyan) 0%, transparent 70%)"
        }}
      />

      <div
        className="gradient-blob animate-fourth absolute left-[-22%] top-[48%] h-[340px] w-[1250px] rounded-full blur-[120px]"
        style={{
          ...blobPerfStyle,
          opacity: 0.54 * opacityScale,
          background: "radial-gradient(ellipse at 40% 52%, var(--blob-blue) 0%, transparent 74%)"
        }}
      />

      <div
        className="gradient-blob animate-fifth absolute right-[10%] top-[8%] h-[420px] w-[420px] rounded-full blur-[120px]"
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
