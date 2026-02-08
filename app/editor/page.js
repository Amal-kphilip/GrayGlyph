"use client";

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useEditorState } from "./hooks";
// processImage is required dynamically to ensure worker init on client only
import EditorSidebar from "./components/EditorSidebar";
import { FaUpload, FaDownload } from "react-icons/fa";
import NextImage from "next/image";
import dynamic from "next/dynamic";

// Dynamic Import for CropOverlay (Client Side Only)
const CropOverlay = dynamic(() => import("./components/CropOverlay"), { ssr: false });

export default function EditorPage() {
    const { state, setImage, updateParam, setParams } = useEditorState();

    // UI Refs
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);
    const containerRef = useRef(null);

    // --- 1. DOUBLE BUFFER ARCHITECTURE ---
    // Mandatory: Original Buffer (Untouched) vs Edited Buffer (Processed)
    const originalBufferRef = useRef(null); // ImageData (Untouched)
    const geometryBufferRef = useRef(null); // ImageData (Geometry-only)
    const editedBufferRef = useRef(null);   // ImageData (Processed)
    const [showOriginal, setShowOriginal] = useState(false);

    // --- 2. PIPELINE STATE ---
    const processingVersion = useRef(0);    // Counter to track latest request
    const isProcessing = useRef(false);     // Flag to avoid overlap
    const pendingParams = useRef(null);     // Debounce storage

    // Helper to track geometry changes for worker updates only
    const lastGeometryParams = useRef(null);
    const isWorkerReady = useRef(false);

    // --- 3. RENDER FUNCTION (LIGHTWEIGHT) ---
    // Draws the selected buffer to the canvas. 
    // Synchronous. Fast. <1ms.
    const render = useCallback((overrideBuffer) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Select Buffer
        // If showing original, use originalBuffer.
        // If showing edited, use editedBuffer (if ready), fallback to original.
        const buffer = showOriginal
            ? (geometryBufferRef.current || originalBufferRef.current)
            : (overrideBuffer || editedBufferRef.current || geometryBufferRef.current || originalBufferRef.current);

        if (!buffer) return;

        // Resize Canvas to match Buffer (Essential for crop/rotate changes)
        if (canvas.width !== buffer.width || canvas.height !== buffer.height) {
            canvas.width = buffer.width;
            canvas.height = buffer.height;
        }

        const ctx = canvas.getContext("2d");
        ctx.putImageData(buffer, 0, 0);
    }, [showOriginal]);


    // --- 4. PROCESSING PIPELINE (HEAVY) ---
    // Orchestrates: Geometry -> Worker -> Edited Buffer
    const requestProcessing = useCallback((params) => {
        if (!state.previewImage || !state.isLoaded) return;

        // 1. Debounce / Versioning
        const myVersion = ++processingVersion.current;

        if (isProcessing.current) {
            pendingParams.current = params;
            return;
        }

        isProcessing.current = true;
        const { applyGeometry, updateWorkerSource, processPixels, hasGeometryChanged } = require("./processor");

        // 2. Async Execution Wrapper
        (async () => {
            try {
                // Check Stale Start
                if (processingVersion.current > myVersion) return;

                // A. Geometry Phase (Main Thread)
                // Only run if geometry changed OR if we need to initialize worker
                let geometryChanged = hasGeometryChanged(lastGeometryParams.current, params);
                if (!isWorkerReady.current) geometryChanged = true;

                if (geometryChanged) {
                    // Create offscreen canvas for geometry calculation
                    // This produces the "Source" (Cropped/Rotated/Flipped) for the filter pipeline
                    // Note: This is NOT the "Original Buffer" (Raw Image)
                    // The "Source" is transient input to the filter chain.
                    const tempCanvas = document.createElement("canvas");
                    const sourceData = applyGeometry(state.previewImage, tempCanvas, params);

                    if (processingVersion.current > myVersion) return; // Stale check

                    if (sourceData) {
                        geometryBufferRef.current = sourceData;
                        editedBufferRef.current = null;
                        render(sourceData);
                        updateWorkerSource(sourceData);
                        lastGeometryParams.current = { ...params };
                        isWorkerReady.current = true;
                    }
                }

                // B. Filter Phase (Worker)
                if (processingVersion.current > myVersion) return; // Stale check before heavy work

                const resultData = await processPixels(params);

                // C. Commit Result
                if (processingVersion.current === myVersion && resultData) {
                    editedBufferRef.current = resultData;
                    render(); // Trigger Draw
                }

            } catch (err) {
                console.error("Processing error:", err);
            } finally {
                isProcessing.current = false;
                // Flush Pending
                if (pendingParams.current) {
                    const nextParams = pendingParams.current;
                    pendingParams.current = null;
                    requestProcessing(nextParams);
                }
            }
        })();

    }, [state.previewImage, state.isLoaded, render]);


    // --- 5. INITIALIZATION ---
    // Runs ONCE on image load
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            // Create Preview / Original Buffer (Max 1920px)
            const MAX = 1920;
            let w = img.width, h = img.height;
            if (w > MAX || h > MAX) {
                const r = w / h;
                if (w > h) { w = MAX; h = w / r; } else { h = MAX; w = h * r; }
            }
            const c = document.createElement("canvas");
            c.width = w; c.height = h;
            const ctx = c.getContext("2d");
            ctx.drawImage(img, 0, 0, w, h);

            // Store Original Buffer (Untouched)
            originalBufferRef.current = ctx.getImageData(0, 0, w, h);
            geometryBufferRef.current = null;
            editedBufferRef.current = null; // Clear old edits

            // Reset Rendering State
            processingVersion.current = 0;
            isWorkerReady.current = false;
            lastGeometryParams.current = null;

            // Update React State
            setImage(img, file.name, c); // 'c' acts as source image for applyGeometry

            // Initial Process (Apply Default Params)
            // (Wait a tick for state to settle or call directly?)
            // We need 'c' (previewImage) available. Since 'setImage' is async React state, 
            // we can't call requestProcessing immediately unless we pass 'c' manually or wait for effect.
            // But strict state management says: wait for effect.
        };
    };

    // --- CROP MODE LOGIC ---
    // Crop overlay needs its own context view
    const [isCropping, setIsCropping] = useState(false);
    const [tempCrop, setTempCrop] = useState(null); // Local Preview State
    const imagePreviewRef = useRef(null);
    const [layoutTrigger, setLayoutTrigger] = useState(0); // Force layout recalcuations

    // --- 6. EFFECTS ---

    // Trigger Processing on Param Change
    useEffect(() => {
        if (state.isLoaded) {
            requestProcessing(state.params);
        }
    }, [state.params, state.isLoaded, requestProcessing]);

    // Trigger Render on Toggle Change (Zero Processing)
    useEffect(() => {
        if (state.isLoaded) {
            render();
        }
    }, [showOriginal, state.isLoaded, render]);

    // Ensure canvas redraws immediately after exiting crop mode
    useEffect(() => {
        if (state.isLoaded && !isCropping) {
            render();
        }
    }, [isCropping, state.isLoaded, render]);

    // useLayoutEffect ensures the canvas is drawn BEFORE paint
    // This prevents the flicker or "stale bounds" issue
    // We also trigger a re-render if the canvas size changed, so CropOverlay can measure again

    useLayoutEffect(() => {
        if (isCropping && state.previewImage && imagePreviewRef.current) {
            const { applyGeometry } = require("./processor");
            // Always show uncropped image content for reference
            const noCropParams = { ...state.params, crop: null };

            // Draw synchronously
            const raw = applyGeometry(state.previewImage, imagePreviewRef.current, noCropParams);
            if (raw) {
                const ctx = imagePreviewRef.current.getContext("2d");
                ctx.putImageData(raw, 0, 0);

                // FORCE RENDER SYNC
                setLayoutTrigger(v => v + 1);
            }
        }
    }, [isCropping, state.params]);

    // Initialize Temp Crop on Enter
    const normalizeCrop = useCallback((crop) => {
        if (!crop) return null;
        const x = Math.min(1, Math.max(0, crop.x));
        const y = Math.min(1, Math.max(0, crop.y));
        const width = Math.min(1, Math.max(0, crop.width));
        const height = Math.min(1, Math.max(0, crop.height));
        if (width <= 0 || height <= 0) return null;
        if (x === 0 && y === 0 && width === 1 && height === 1) return null;
        return { x, y, width, height };
    }, []);

    useEffect(() => {
        if (isCropping) {
            const committed = state.params.crop ? { ...state.params.crop } : null;
            setTempCrop(committed);
        }
    }, [isCropping, state.params.crop]); // Only run on toggle

    const handleCropDone = () => {
        // COMMIT: Update global state -> Triggers Pipeline
        const committedCrop = normalizeCrop(tempCrop);
        updateParam("crop", committedCrop);
        requestProcessing({ ...state.params, crop: committedCrop });
        setIsCropping(false);
    };

    const handleCropCancel = () => {
        // DISCARD: Just close
        setTempCrop(state.params.crop ? { ...state.params.crop } : null);
        setIsCropping(false);
    };

    // --- EXPORT LOGIC ---
    const handleDownload = async () => {
        if (!state.originalImage) return;

        const offCanvas = document.createElement("canvas");
        const { applyGeometry } = require("./processor");

        // 1. Full Res Geometry
        // Ensure we use the COMMITTED crop (state.params), not tempCrop
        const sourceData = applyGeometry(state.originalImage, offCanvas, state.params);
        if (!sourceData) return;

        // 2. Full Res Process (One-shot) using a dedicated worker
        const exportWorker = new Worker(new URL("./worker.js", import.meta.url));
        const jobId = 1;
        const processed = await new Promise((resolve) => {
            const handleMsg = (e) => {
                if (e.data.jobId === jobId || e.data.imageData) {
                    exportWorker.removeEventListener("message", handleMsg);
                    resolve(e.data.imageData || null);
                }
            };
            exportWorker.addEventListener("message", handleMsg);
            exportWorker.postMessage({ type: "SET_SOURCE", imageData: sourceData }, [sourceData.data.buffer]);
            exportWorker.postMessage({
                type: "PROCESS",
                params: JSON.parse(JSON.stringify(state.params)),
                jobId
            });
        });
        exportWorker.terminate();

        // 3. Save
        const finalData = processed || applyGeometry(state.originalImage, offCanvas, state.params);
        if (finalData) {
            const ctx = offCanvas.getContext("2d");
            ctx.putImageData(finalData, 0, 0);

            const blob = await new Promise((resolve) => {
                offCanvas.toBlob((b) => resolve(b), "image/jpeg", 0.95);
            });

            const link = document.createElement("a");
            link.download = "edited-" + state.imageName;
            link.rel = "noopener";

            if (blob) {
                const url = URL.createObjectURL(blob);
                link.href = url;
                document.body.appendChild(link);
                link.click();
                link.remove();
                URL.revokeObjectURL(url);
            } else {
                link.href = offCanvas.toDataURL("image/jpeg", 0.95);
                document.body.appendChild(link);
                link.click();
                link.remove();
            }
        }
    };


    // --- RENDER UI ---

    if (!state.isLoaded) {
        // ... LANDING PAGE ...
        return (
            <div className="relative min-h-screen w-full overflow-x-hidden font-sans text-ink">
                {/* Background (Matches Home) */}
                <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
                    <span className="absolute -left-16 -top-20 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(213,108,79,0.4),transparent_70%)]" />
                    <span className="absolute right-[-140px] top-28 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(60,125,108,0.32),transparent_70%)]" />
                    <span className="absolute bottom-[-90px] left-[40%] h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(38,57,79,0.2),transparent_70%)]" />
                </div>

                <main className="mx-auto w-[min(1200px,92vw)] py-6 md:py-8">
                    <div className="mb-5 flex items-center gap-3">
                        <Link href="/" aria-label="GrayGlyph Home" className="inline-flex items-center">
                            <NextImage src="/assets/grayglyph-logo.png" alt="GrayGlyph logo" width={180} height={40} className="h-8 w-auto object-contain md:h-9" priority />
                        </Link>
                    </div>

                    <header className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                        <section className="glass-panel animate-rise p-5 md:p-8 flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-blue-100 text-blue-700 tracking-wide">New</span>
                                <span className="text-sm font-medium text-ink-soft">Browser-based Editor</span>
                            </div>
                            <h1 className="font-serifDisplay text-4xl leading-tight text-ink md:text-5xl lg:text-6xl mb-6">
                                Professional Color Grading & Photo Editing
                            </h1>
                            <p className="text-lg leading-relaxed text-ink-soft md:text-xl mb-8 max-w-xl">
                                Master your images with precise tone curves, HSL color mixing, and cinematic presets. 100% private.
                            </p>
                            <button onClick={() => fileInputRef.current.click()} className="btn-primary text-lg px-8 py-3 shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all transform hover:-translate-y-0.5">
                                Start Editing Now
                            </button>
                        </section>
                        <section className="grid gap-3 sm:grid-cols-2">
                            <article className="glass-soft-panel animate-rise p-6 flex flex-col justify-center" style={{ animationDelay: "100ms" }}>
                                <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-4 text-xl">🎨</div>
                                <h3 className="text-lg font-bold text-ink mb-2">Color Grading</h3>
                                <p className="text-sm text-ink-soft leading-relaxed">
                                    Split toning for shadows, midtones, and highlights with adjustable balance.
                                </p>
                            </article>

                            <article className="glass-soft-panel animate-rise p-6 flex flex-col justify-center" style={{ animationDelay: "200ms" }}>
                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4 text-xl">📈</div>
                                <h3 className="text-lg font-bold text-ink mb-2">Tone Curves</h3>
                                <p className="text-sm text-ink-soft leading-relaxed">
                                    Precise Master, Red, Green, and Blue channel curve adjustments.
                                </p>
                            </article>

                            <article className="glass-soft-panel animate-rise p-6 flex flex-col justify-center" style={{ animationDelay: "300ms" }}>
                                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-4 text-xl">🔒</div>
                                <h3 className="text-lg font-bold text-ink mb-2">Private & Secure</h3>
                                <p className="text-sm text-ink-soft leading-relaxed">
                                    No uploads. All processing happens locally in your browser via Web Workers.
                                </p>
                            </article>

                            <article className="glass-soft-panel animate-rise p-6 flex flex-col justify-center" style={{ animationDelay: "400ms" }}>
                                <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center mb-4 text-xl">⚡</div>
                                <h3 className="text-lg font-bold text-ink mb-2">Instant Preview</h3>
                                <p className="text-sm text-ink-soft leading-relaxed">
                                    Real-time processing with zero latency. Toggle Before/After instantly.
                                </p>
                            </article>
                        </section>
                    </header>
                </main>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>
        );
    }

    return (
        <div className="flex h-screen flex-col bg-gray-100 overflow-hidden font-sans fixed inset-0">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

                        {/* Toolbar */}
            <header className="flex-shrink-0 bg-white border-b border-gray-200 px-3 py-2 z-20 shadow-sm">
                <div className="relative flex flex-col gap-2 sm:h-12 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 sm:gap-4">
                        <Link href="/" className="font-bold text-gray-800 tracking-tight flex items-center gap-2">
                            <span className="inline-flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center text-yellow-500" aria-hidden="true">
                                <svg viewBox="0 0 20 20" className="h-full w-full fill-current">
                                    <path d="M11.6 1.5 3 11.2h5l-1.6 7.3L17 8.8h-5l-0.4-7.3z" />
                                </svg>
                            </span>
                            <span className="truncate max-w-[40vw] sm:max-w-none">GrayGlyph</span>
                            <span className="hidden sm:inline text-xs font-normal text-gray-500 uppercase px-1.5 py-0.5 bg-gray-100 rounded">Editor</span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-2 sm:order-3">
                        <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200">
                            <FaUpload size={12} /> Open
                        </button>
                        <button onClick={handleDownload} disabled={!state.isLoaded} className="flex items-center gap-2 px-4 py-1.5 text-xs sm:text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors shadow-sm">
                            <FaDownload size={12} /> Export
                        </button>
                    </div>

                    <div className="flex items-center justify-center gap-2 sm:absolute sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2">
                        <button
                            onMouseDown={() => setShowOriginal(true)}
                            onMouseUp={() => setShowOriginal(false)}
                            onMouseLeave={() => setShowOriginal(false)}
                            onTouchStart={() => setShowOriginal(true)}
                            onTouchEnd={() => setShowOriginal(false)}
                            disabled={!state.isLoaded || isCropping}
                            className={`flex items-center gap-2 px-3 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-full transition-all select-none 
                            ${showOriginal ? "bg-blue-600 text-white shadow-inner" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                        >
                            <span className="sm:hidden">{showOriginal ? "Original" : "Before"}</span>
                            <span className="hidden sm:inline">{showOriginal ? "Original" : "Hold for Before"}</span>
                        </button>
                        {isCropping && (
                            <div className="flex gap-2">
                                <button onClick={handleCropCancel} className="bg-gray-700 text-white px-3 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-full shadow-lg hover:bg-gray-600">
                                    Cancel
                                </button>
                                <button onClick={handleCropDone} className="bg-green-600 text-white px-3 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-full shadow-lg hover:bg-green-500">
                                    Done
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Editor Workspace */}
            <div className="flex-1 flex overflow-hidden flex-col lg:flex-row animate-in fade-in duration-300">
                <main className="flex-1 relative bg-[#1e1e1e] flex items-center justify-center p-4 sm:p-8 overflow-hidden order-1 lg:order-1 h-[50vh] lg:h-auto" ref={containerRef}>
                    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(#888 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>

                    {/* MAIN CANVAS */}
                    {/* Note: We rely on the Render Loop to draw here. No logic inside JSX for canvas updates. */}
                    <canvas
                        ref={canvasRef}
                        className={`max-w-full max-h-full shadow-2xl object-contain ring-1 ring-white/10 ${isCropping ? 'hidden' : 'block'}`}
                    />

                    {/* CROP MODE view logic stays in Effect/JSX, but uses separate canvas ref */}
                    {isCropping && (
                        <>
                            <canvas ref={imagePreviewRef} className="max-w-full max-h-full shadow-2xl object-contain ring-1 ring-blue-500/50" />
                            {(() => {
                                const CropOverlay = require("./components/CropOverlay").default;
                                return (
                                    <CropOverlay
                                        crop={tempCrop}
                                        onCropChange={setTempCrop}
                                        imageRef={imagePreviewRef}
                                        containerRef={containerRef}
                                        layoutTrigger={layoutTrigger}
                                    />
                                );
                            })()}
                        </>
                    )}
                </main>

                <aside className="w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 z-10 flex flex-col order-2 lg:order-2 h-[50vh] lg:h-auto">
                    <EditorSidebar
                        params={state.params}
                        updateParam={updateParam}
                        setParams={setParams}
                        isCropping={isCropping}
                        setIsCropping={setIsCropping}
                        onCropDone={handleCropDone}
                    />
                </aside>
            </div>
        </div>
    );
}

