import { useRef, useEffect, useState } from "react";
import { getSliderBackground } from "../utils"; // Reuse logic if possible, or duplicate safely

export default function Slider({ label, value, min, max, onChange, step = 1, resetValue = 0 }) {
  // Local state for immediate feedback during drag (if beneficial), though 
  // we rely on parent state for Source of Truth.

  // Helper to generate background gradient (Duplicating small logic to avoid complex imports if utils in parent)
  const getBackground = (val, min, max) => {
    const percentage = ((val - min) / (max - min)) * 100;
    // Using the same blue accent: #1672f3
    return `linear-gradient(to right, #1672f3 ${percentage}%, rgba(18, 21, 28, 0.12) ${percentage}%)`;
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <label className="text-xs font-medium text-gray-700">{label}</label>
        <span
          className="text-xs text-gray-500 font-mono cursor-pointer hover:text-accent"
          onClick={() => onChange(resetValue)}
          title="Click to reset"
        >
          {value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/20 rounded-full"
        style={{ "--track-bg": getBackground(value, min, max) }}
      />
      <style jsx>{`
        /* Reset */
        input[type=range] {
          -webkit-appearance: none; /* Required for WebKit */
          width: 100%; 
          background: transparent; /* Required for Chrome */
          margin: 0;
          height: 20px; /* IMPORTANT: Height >= Thumb Height to prevent clipping */
        }

        /* WebKit Track */
        input[type=range]::-webkit-slider-runnable-track {
            width: 100%;
            height: 6px;
            background: var(--track-bg);
            border-radius: 999px;
            border: none;
            cursor: pointer;
        }

        /* WebKit Thumb */
        input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            height: 16px;
            width: 16px;
            border-radius: 50%;
            background: #1672f3;
            border: 2px solid white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
            cursor: pointer;
            margin-top: -5px; /* (TrackHeight 6px - ThumbHeight 16px) / 2 = -5px */
            /* Vertical alignment: track top is 0, height 6. Thumb top is -5 relative to track. */
            position: relative;
            z-index: 10;
        }

        input[type=range]:focus::-webkit-slider-thumb {
            box-shadow: 0 0 0 3px rgba(22, 114, 243, 0.3);
        }

        /* Firefox Track */
        input[type=range]::-moz-range-track {
            width: 100%;
            height: 6px;
            background: var(--track-bg);
            border-radius: 999px;
            border: none;
            cursor: pointer;
        }

        /* Firefox Thumb */
        input[type=range]::-moz-range-thumb {
            height: 16px;
            width: 16px;
            border: 2px solid white;
            border-radius: 50%;
            background: #1672f3;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
            cursor: pointer;
            border: none; /* Reset default border if any */
        }

        /* IE / Edge Legacy */
        input[type=range]::-ms-track {
            width: 100%;
            height: 6px;
            background: transparent; 
            border-color: transparent;
            color: transparent;
        }

        input[type=range]::-ms-fill-lower {
            background: var(--track-bg);
            border-radius: 999px;
        }

        input[type=range]::-ms-fill-upper {
            background: #e5e7eb;
            border-radius: 999px;
        }

        input[type=range]::-ms-thumb {
            height: 16px;
            width: 16px;
            border-radius: 50%;
            background: #1672f3;
            border: 2px solid white;
            cursor: pointer;
            margin-top: 0;
        }
      `}</style>
    </div>
  );
}
