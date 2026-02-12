import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { clamp, generateToneCurveLUT } from "../utils";

export default function CurveEditor({ points, onChange, color = "var(--curve-default)" }) {
  const svgRef = useRef(null);
  const [activePointIndex, setActivePointIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const sortedPoints = useMemo(() => {
    return [...points].sort((a, b) => a.x - b.x);
  }, [points]);

  const pathData = useMemo(() => {
    if (sortedPoints.length < 2) return "";

    const lut = generateToneCurveLUT(sortedPoints);
    let d = `M 0 ${100 - (lut[0] / 255 * 100)}`;

    for (let i = 2; i < 256; i += 2) {
      const x = (i / 255) * 100;
      const y = 100 - (lut[i] / 255 * 100);
      d += ` L ${x} ${y}`;
    }

    return d;
  }, [sortedPoints]);

  const handleMouseDown = (e, index) => {
    e.stopPropagation();
    setActivePointIndex(index);
    setIsDragging(true);
  };

  const handleSvgMouseDown = (e) => {
    if (activePointIndex !== null || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    const y = clamp(1 - (e.clientY - rect.top) / rect.height, 0, 1);

    onChange([...points, { x, y }]);
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging || activePointIndex === null || !svgRef.current) return;

      const rect = svgRef.current.getBoundingClientRect();
      let x = (e.clientX - rect.left) / rect.width;
      let y = 1 - (e.clientY - rect.top) / rect.height;

      x = clamp(x, 0, 1);
      y = clamp(y, 0, 1);

      const nextPoints = [...points];
      if (activePointIndex === 0) x = 0;
      if (activePointIndex === points.length - 1) x = 1;

      nextPoints[activePointIndex] = { x, y };
      onChange(nextPoints);
    },
    [activePointIndex, isDragging, onChange, points]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setActivePointIndex(null);
  }, []);

  const handleDoubleClick = (e, index) => {
    e.stopPropagation();
    if (index === 0 || index === points.length - 1) return;
    onChange(points.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (!isDragging) return;

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp, isDragging]);

  return (
    <div className="relative mb-4 aspect-square w-full select-none overflow-hidden rounded-xl border border-[var(--glass-border)] bg-[var(--bg-secondary)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage: "linear-gradient(var(--border-primary) 1px, transparent 1px), linear-gradient(90deg, var(--border-primary) 1px, transparent 1px)",
          backgroundSize: "25% 25%"
        }}
      />

      <div className="pointer-events-none absolute inset-0">
        <svg viewBox="0 0 100 100" className="h-full w-full opacity-25" preserveAspectRatio="none">
          <line x1="0" y1="100" x2="100" y2="0" stroke="var(--crop-stroke)" strokeWidth="0.5" strokeDasharray="2,2" />
        </svg>
      </div>

      <svg
        ref={svgRef}
        viewBox="0 0 100 100"
        className="relative z-10 h-full w-full cursor-crosshair"
        preserveAspectRatio="none"
        onMouseDown={handleSvgMouseDown}
      >
        <path d={pathData} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />

        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x * 100}
            cy={100 - p.y * 100}
            r="3"
            fill={activePointIndex === i ? color : "var(--curve-point-bg)"}
            stroke={color}
            strokeWidth="1.5"
            className="cursor-pointer transition-all hover:r-5"
            onMouseDown={(e) => handleMouseDown(e, i)}
            onDoubleClick={(e) => handleDoubleClick(e, i)}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
    </div>
  );
}
