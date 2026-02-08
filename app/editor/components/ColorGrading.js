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

    // Safe access
    const grading = params.colorGrading || {
        shadows: { h: 0, s: 0, l: 0 },
        midtones: { h: 0, s: 0, l: 0 },
        highlights: { h: 0, s: 0, l: 0 },
        blending: 50,
        balance: 0
    };

    // Ensure active wheel exists
    const current = grading[activeWheel] || { h: 0, s: 0, l: 0 };

    return (
        <div className="space-y-6">
            {/* Wheel Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-lg">
                {WHEELS.map((w) => (
                    <button
                        key={w.key}
                        onClick={() => setActiveWheel(w.key)}
                        className={`flex-1 py-1 text-xs font-semibold rounded-md transition ${activeWheel === w.key ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-black"}`}
                    >
                        {w.label}
                    </button>
                ))}
            </div>

            {/* Active Wheel Controls */}
            <div className="animate-rise space-y-4">
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

                <div className="pt-2 border-t border-gray-100">
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

// Interactive Color Wheel Subcomponent
function ColorWheel({ hue, sat, onChange }) {
    const wheelRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);

    // Handling circular logic manually
    const calculateColor = (clientX, clientY) => {
        if (!wheelRef.current) return;

        const rect = wheelRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const x = clientX - centerX;
        const y = clientY - centerY;

        // Calculate Angle (Hue)
        let angle = Math.atan2(y, x) * (180 / Math.PI);
        if (angle < 0) angle += 360;
        angle = (angle + 90) % 360; // Adjust so 0 is Top-ish

        // Calculate Distance (Sat)
        const radius = rect.width / 2;
        const dist = Math.min(Math.sqrt(x * x + y * y), radius);
        const s = (dist / radius) * 100;

        return { h: angle, s };
    };

    const handlePointerDown = (e) => {
        e.preventDefault(); // Prevent scrolling on touch
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

    // Position of the "Thumb"
    const rad = (hue - 90) * (Math.PI / 180);
    const dist = (sat / 100) * 50; // 50% is radius
    // Center is 50, 50
    const thumbX = 50 + Math.cos(rad) * dist;
    const thumbY = 50 + Math.sin(rad) * dist;

    return (
        <div className="flex justify-center py-2">
            <div
                ref={wheelRef}
                className="relative w-40 h-40 rounded-full cursor-crosshair shadow-inner touch-none"
                style={{
                    background: `
                        radial-gradient(circle, white 0%, transparent 80%),
                        conic-gradient(red, yellow, lime, cyan, blue, magenta, red)
                    `
                }}
                onPointerDown={handlePointerDown}
            >
                {/* Thumb */}
                <div
                    className="absolute w-3 h-3 border-2 border-white rounded-full bg-transparent shadow-sm pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                        left: `${thumbX}%`,
                        top: `${thumbY}%`,
                    }}
                />
            </div>
        </div>
    );
}
