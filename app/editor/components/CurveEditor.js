import { useState, useRef, useEffect, useMemo } from "react";
import { clamp, generateToneCurveLUT } from "../utils";

export default function CurveEditor({ points, onChange, color = "white" }) {
    const svgRef = useRef(null);
    const [activePointIndex, setActivePointIndex] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    // Sort points to draw line correctly
    const sortedPoints = useMemo(() => {
        return [...points].sort((a, b) => a.x - b.x);
    }, [points]);

    // Generate path data using the actual Spline LUT
    const pathData = useMemo(() => {
        if (sortedPoints.length < 2) return "";

        const lut = generateToneCurveLUT(sortedPoints);

        // Construct path from LUT (0-255 mapped to 0-100 coordinate space)
        let d = `M 0 ${100 - (lut[0] / 255 * 100)}`;

        // Step through LUT to create smooth curve
        // 256 points might be too many for simple SVG, step by 2 or 4 is fine.
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
        if (activePointIndex !== null) return;

        // Add new point
        const rect = svgRef.current.getBoundingClientRect();
        const x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
        const y = clamp(1 - (e.clientY - rect.top) / rect.height, 0, 1);

        const newPoints = [...points, { x, y }];
        onChange(newPoints);
    };

    const handleMouseMove = (e) => {
        if (!isDragging || activePointIndex === null) return;

        const rect = svgRef.current.getBoundingClientRect();
        let x = (e.clientX - rect.left) / rect.width;
        let y = 1 - (e.clientY - rect.top) / rect.height;

        // Constraints
        // 1. Clamp to 0-1
        x = clamp(x, 0, 1);
        y = clamp(y, 0, 1);

        // 2. Keep endpoints pinned to x=0 and x=1? 
        // Usually curve editors pin the x-coordinates of endpoints but allow y-movement,
        // OR they allow moving them but ensure x stays 0/1. 
        // Let's allow free movement but clamp x to neighbors to avoid loop-de-loops.

        // Simple constraint: Standard curves usually just replace the point.
        // We need to update the specific point in the array.

        const nextPoints = [...points];

        // Lock endpoints x-axis
        if (activePointIndex === 0) x = 0;
        if (activePointIndex === points.length - 1) x = 1;

        // Prevent crossing neighbors (optional, but good for validity)
        // if (activePointIndex > 0) x = Math.max(x, nextPoints[activePointIndex - 1].x + 0.01);
        // if (activePointIndex < points.length - 1) x = Math.min(x, nextPoints[activePointIndex + 1].x - 0.01);

        nextPoints[activePointIndex] = { x, y };
        onChange(nextPoints);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setActivePointIndex(null);
    };

    // Delete point on double click (except endpoints)
    const handleDoubleClick = (e, index) => {
        e.stopPropagation();
        if (index === 0 || index === points.length - 1) return; // Don't delete endpoints

        const newPoints = points.filter((_, i) => i !== index);
        onChange(newPoints);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        } else {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        }
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging, activePointIndex, points]); // Dependencies crucial here

    return (
        <div className="relative w-full aspect-square bg-[#2a2a2a] rounded select-none border border-gray-600 mb-4 overflow-hidden">
            {/* Grid Lines */}
            <div className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                    backgroundImage: "linear-gradient(#888 1px, transparent 1px), linear-gradient(90deg, #888 1px, transparent 1px)",
                    backgroundSize: "25% 25%"
                }}
            />
            {/* Baseline */}
            <div className="absolute inset-0 pointer-events-none">
                <svg viewBox="0 0 100 100" className="w-full h-full opacity-20" preserveAspectRatio="none">
                    <line x1="0" y1="100" x2="100" y2="0" stroke="white" strokeWidth="0.5" strokeDasharray="2,2" />
                </svg>
            </div>

            <svg
                ref={svgRef}
                viewBox="0 0 100 100"
                className="w-full h-full cursor-crosshair relative z-10"
                preserveAspectRatio="none"
                onMouseDown={handleSvgMouseDown}
            >
                <path
                    d={pathData}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                />

                {points.map((p, i) => (
                    <circle
                        key={i}
                        cx={p.x * 100}
                        cy={100 - p.y * 100}
                        r="3" // Radius in SVG units. With preserveAspectRatio='none', this might distort.
                        // Better to use vector-effect or consistent units if possible. 
                        // For simple box 0-100, r=4 is okay.
                        fill={activePointIndex === i ? color : "#1a1a1a"}
                        stroke={color}
                        strokeWidth="1.5"
                        className="cursor-pointer hover:r-5 transition-all"
                        onMouseDown={(e) => handleMouseDown(e, i)}
                        onDoubleClick={(e) => handleDoubleClick(e, i)}
                        vectorEffect="non-scaling-stroke"
                    />
                ))}
            </svg>
        </div>
    );
}
