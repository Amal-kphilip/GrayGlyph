import { useState, useRef, useEffect } from "react";

export default function CropOverlay({ crop, onCropChange, imageRef, containerRef, layoutTrigger }) {
    const [dragging, setDragging] = useState(null); // 'tl', 'tr', 'bl', 'br', 'move'

    // We need to map the normalized crop (0-1) to the currently displayed image dimensions.
    // The image might be scaled via CSS "object-contain".

    const getDisplayRect = () => {
        if (!imageRef.current) return { x: 0, y: 0, w: 0, h: 0 };
        const rect = imageRef.current.getBoundingClientRect();
        const parent = containerRef.current.getBoundingClientRect();

        return {
            x: rect.left - parent.left,
            y: rect.top - parent.top,
            w: rect.width,
            h: rect.height,
            naturalW: imageRef.current.width,
            naturalH: imageRef.current.height
        };
    };

    const handleMouseDown = (e, type) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(type);
    };

    // Global mouse move/up handlers are needed
    useEffect(() => {
        if (!dragging) return;

        const handleMouseMove = (e) => {
            const display = getDisplayRect();
            if (display.w === 0) return;

            // Mouse relative to Image Top-Left
            const parent = containerRef.current.getBoundingClientRect();
            const mouseX = e.clientX - parent.left - display.x;
            const mouseY = e.clientY - parent.top - display.y;

            // Normalized Mouse Pos (0-1)
            const nX = Math.max(0, Math.min(1, mouseX / display.w));
            const nY = Math.max(0, Math.min(1, mouseY / display.h));

            const currentCrop = crop || { x: 0, y: 0, width: 1, height: 1 };
            let nextCrop = { ...currentCrop };

            if (dragging === 'move') {
                // Implement drag move? Keeping it simple: handles only first.
            } else if (dragging === 'br') {
                nextCrop.width = Math.max(0.1, nX - nextCrop.x);
                nextCrop.height = Math.max(0.1, nY - nextCrop.y);
            } else if (dragging === 'tl') {
                const maxX = nextCrop.x + nextCrop.width;
                const maxY = nextCrop.y + nextCrop.height;
                nextCrop.x = Math.min(maxX - 0.1, nX);
                nextCrop.y = Math.min(maxY - 0.1, nY);
                nextCrop.width = maxX - nextCrop.x;
                nextCrop.height = maxY - nextCrop.y;
            }
            // ... other handles

            // ... other handles

            onCropChange(nextCrop);
        };

        const handleMouseUp = () => {
            setDragging(null);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [dragging, crop]);

    // Render Overlay
    const display = getDisplayRect();
    const currentCrop = crop || { x: 0, y: 0, width: 1, height: 1 };

    if (display.w === 0) return null;

    const style = {
        left: display.x + (currentCrop.x * display.w),
        top: display.y + (currentCrop.y * display.h),
        width: currentCrop.width * display.w,
        height: currentCrop.height * display.h,
    };

    return (
        <div className="absolute border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] pointer-events-auto" style={style}>
            {/* Grid */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-50">
                <div className="border-r border-b border-white/30"></div>
                <div className="border-r border-b border-white/30"></div>
                <div className="border-b border-white/30"></div>

                <div className="border-r border-b border-white/30"></div>
                <div className="border-r border-b border-white/30"></div>
                <div className="border-b border-white/30"></div>

                <div className="border-r border-white/30"></div>
                <div className="border-r border-white/30"></div>
                <div></div>
            </div>

            {/* Handles */}
            <div className="absolute -left-2 -top-2 w-4 h-4 bg-white border border-gray-400 cursor-nw-resize" onMouseDown={(e) => handleMouseDown(e, 'tl')} />
            <div className="absolute -right-2 -bottom-2 w-4 h-4 bg-white border border-gray-400 cursor-se-resize" onMouseDown={(e) => handleMouseDown(e, 'br')} />
            {/* Add more handles as needed */}
        </div>
    );
}
