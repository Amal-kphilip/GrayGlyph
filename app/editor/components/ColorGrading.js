import { useState, useRef, useEffect } from "react";
import Slider from "./Slider";

const WHEELS = [
  { key: "shadows", label: "Shadows" },
  { key: "midtones", label: "Midtones" },
  { key: "highlights", label: "Highlights" }
];

export default function ColorGrading({ params, updateParam }) {
  const [activeWheel, setActiveWheel] = useState("shadows");

  const updateGrading = (wheel, type, val) => {
    const newGrading = { ...params.colorGrading };
    newGrading[wheel] = { ...newGrading[wheel], [type]: val };
    updateParam("colorGrading", newGrading);
  };

  const grading = params.colorGrading || {
    shadows: { h: 0, s: 0, l: 0 },
    midtones: { h: 0, s: 0, l: 0 },
    highlights: { h: 0, s: 0, l: 0 },
    blending: 50,
    balance: 0
  };

  const current = grading[activeWheel] || { h: 0, s: 0, l: 0 };

  return (
    <div className="space-y-6">
      <div className="flex rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-1 backdrop-blur-xl">
        {WHEELS.map((w) => (
          <button
            key={w.key}
            onClick={() => setActiveWheel(w.key)}
            className={`flex-1 rounded-lg py-2 text-xs font-medium transition ${activeWheel === w.key ? "bg-[var(--glass-hover)] text-[var(--text-primary)] shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
          >
            {w.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <ColorWheel
          hue={current.h}
          sat={current.s}
          onChange={(h, s) => {
            const newGrading = { ...params.colorGrading };
            newGrading[activeWheel] = { ...newGrading[activeWheel], h, s };
            updateParam("colorGrading", newGrading);
          }}
        />

        <Slider
          label="Luminance"
          value={current.l}
          min={-100}
          max={100}
          onChange={(v) => updateGrading(activeWheel, "l", v)}
        />

        <div className="border-t border-[var(--glass-border)] pt-2">
          <Slider
            label="Blending"
            value={params.colorGrading.blending}
            min={0}
            max={100}
            onChange={(v) => {
              const newGrading = { ...params.colorGrading, blending: v };
              updateParam("colorGrading", newGrading);
            }}
          />
          <Slider
            label="Balance"
            value={params.colorGrading.balance}
            min={-100}
            max={100}
            onChange={(v) => {
              const newGrading = { ...params.colorGrading, balance: v };
              updateParam("colorGrading", newGrading);
            }}
          />
        </div>
      </div>
    </div>
  );
}

function ColorWheel({ hue, sat, onChange }) {
  const wheelRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const calculateColor = (clientX, clientY) => {
    if (!wheelRef.current) return;

    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = clientX - centerX;
    const y = clientY - centerY;

    let angle = Math.atan2(y, x) * (180 / Math.PI);
    if (angle < 0) angle += 360;
    angle = (angle + 90) % 360;

    const radius = rect.width / 2;
    const dist = Math.min(Math.sqrt(x * x + y * y), radius);
    const s = (dist / radius) * 100;

    return { h: angle, s };
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    const color = calculateColor(e.clientX, e.clientY);
    if (color) onChange(color.h, color.s);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e) => {
      const color = calculateColor(e.clientX, e.clientY);
      if (color) onChange(color.h, color.s);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging, onChange]);

  const rad = (hue - 90) * (Math.PI / 180);
  const dist = (sat / 100) * 50;
  const thumbX = 50 + Math.cos(rad) * dist;
  const thumbY = 50 + Math.sin(rad) * dist;

  return (
    <div className="flex justify-center py-2">
      <div
        ref={wheelRef}
        className="relative h-40 w-40 cursor-crosshair rounded-full shadow-inner touch-none"
        style={{
          background: `
            radial-gradient(circle, white 0%, transparent 80%),
            conic-gradient(red, yellow, lime, cyan, blue, magenta, red)
          `
        }}
        onPointerDown={handlePointerDown}
      >
        <div
          className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--crop-handle-bg)] bg-transparent shadow-sm"
          style={{
            left: `${thumbX}%`,
            top: `${thumbY}%`
          }}
        />
      </div>
    </div>
  );
}
