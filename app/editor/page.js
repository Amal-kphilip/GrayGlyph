"use client";

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import { useEditorState } from "./hooks";
// processImage is required dynamically to ensure worker init on client only
import EditorSidebar from "./components/EditorSidebar";
import { FaUpload, FaDownload } from "react-icons/fa";
import FeatureNavbar from "../components/FeatureNavbar";
import FeatureHero from "../components/FeatureHero";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
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
        return (
            <div className="min-h-screen w-full overflow-x-hidden text-[var(--text-primary)]">
                <main className="page-shell">
                    <FeatureNavbar
                        links={[
                            { href: "/grayscale", label: "Grayscale" },
                            { href: "/color-transfer", label: "Color Transfer" }
                        ]}
                    />

                    <section className="section-gap">
                        <FeatureHero
                            label="BROWSER-BASED EDITOR"
                            title="Professional Color Grading & Photo Editing"
                            description="Master tone curves, HSL mixing, crop, geometry, and cinematic presets - fully in your browser."
                            ctaLabel="Start Editing"
                            onCtaClick={() => fileInputRef.current?.click()}
                        />
                    </section>

                    <section className="section-gap">
                        <div className="glass-panel overflow-hidden p-0">
                            <div className="flex min-h-[56vh] flex-col lg:min-h-[62vh] lg:flex-row">
                                <main className="relative flex min-h-[280px] flex-1 items-center justify-center overflow-hidden bg-transparent p-4 sm:min-h-[320px] sm:p-6">
                                    <Card variant="glass" className="relative z-10 max-w-sm p-6 text-center">
                                        <h3 className="text-xl">Editor Workspace</h3>
                                        <p className="mt-2 text-sm text-ink-soft">Open an image to start editing with live preview and professional controls.</p>
                                        <Button type="button" onClick={() => fileInputRef.current?.click()} className="mt-5">
                                            Start Editing
                                        </Button>
                                    </Card>
                                </main>
                                <aside className="h-[50vh] min-h-[18rem] w-full overflow-hidden border-t border-[var(--glass-border)] bg-[var(--glass-bg)] lg:h-auto lg:min-h-[22rem] lg:w-[25rem] lg:border-l lg:border-t-0">
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
                    </section>
                </main>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>
        );
    }

    return (
        <div className="min-h-[100dvh] h-[100dvh] flex flex-col text-[var(--text-primary)]">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

            <div className="mx-auto flex h-full w-full max-w-[1440px] flex-col px-3 py-3 sm:px-6 sm:py-4 lg:px-8">
                <FeatureNavbar
                    className="flex-shrink-0"
                    links={[
                        { href: "/grayscale", label: "Grayscale" },
                        { href: "/color-transfer", label: "Color Transfer" }
                    ]}
                />

                <section className="glass-panel mt-3 flex min-h-0 flex-1 flex-col overflow-hidden p-0 sm:mt-4">
                    <div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 sm:gap-3 sm:px-4 sm:py-3">
                        <div className="flex items-center gap-2">
                            <Button type="button" variant="ghost" onClick={() => fileInputRef.current?.click()} className="gap-1.5 px-4 py-2 text-xs sm:text-sm">
                                <FaUpload size={12} /> Open
                            </Button>
                            <Button type="button" onClick={handleDownload} disabled={!state.isLoaded} className="gap-1.5 px-4 py-2 text-xs sm:text-sm disabled:cursor-not-allowed disabled:opacity-60">
                                <FaDownload size={12} /> Export
                            </Button>
                        </div>

                        <div className="flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] px-2 py-2 backdrop-blur-xl">
                            <button
                                onMouseDown={() => setShowOriginal(true)}
                                onMouseUp={() => setShowOriginal(false)}
                                onMouseLeave={() => setShowOriginal(false)}
                                onTouchStart={() => setShowOriginal(true)}
                                onTouchEnd={() => setShowOriginal(false)}
                                disabled={!state.isLoaded || isCropping}
                                className={`select-none rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide transition-all sm:text-xs ${showOriginal ? "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-inner" : "bg-[var(--glass-bg)] text-[var(--text-primary)] hover:bg-[var(--glass-hover)]"}`}
                            >
                                <span className="sm:hidden">{showOriginal ? "Original" : "Before"}</span>
                                <span className="hidden sm:inline">{showOriginal ? "Original" : "Hold for Before"}</span>
                            </button>
                            {isCropping && (
                                <div className="flex gap-2">
                                    <button onClick={handleCropCancel} className="rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-primary)] hover:bg-[var(--glass-hover)] sm:text-xs">
                                        Cancel
                                    </button>
                                    <button onClick={handleCropDone} className="rounded-full bg-[var(--accent)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--accent-foreground)] shadow-sm sm:text-xs">
                                        Done
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
                        <main className="relative flex min-h-[38vh] flex-1 items-center justify-center overflow-hidden bg-transparent p-2 sm:min-h-0 sm:p-4" ref={containerRef}>
                            <canvas
                                ref={canvasRef}
                                className={`relative z-10 block max-h-full max-w-full rounded-2xl object-contain shadow-2xl ring-1 ring-[var(--glass-border)] ${isCropping ? "hidden" : "block"}`}
                            />

                            {isCropping && (
                                <>
                                    <canvas ref={imagePreviewRef} className="relative z-10 max-h-full max-w-full rounded-2xl object-contain shadow-2xl ring-1 ring-accent/50" />
                                    <CropOverlay
                                        crop={tempCrop}
                                        onCropChange={setTempCrop}
                                        imageRef={imagePreviewRef}
                                        containerRef={containerRef}
                                        layoutTrigger={layoutTrigger}
                                    />
                                </>
                            )}
                        </main>

                        <aside className="h-[46vh] max-h-[52vh] min-h-0 w-full flex-shrink-0 overflow-hidden border-t border-[var(--glass-border)] bg-[var(--glass-bg)] sm:h-[42vh] lg:h-auto lg:max-h-none lg:w-[380px] lg:border-l lg:border-t-0">
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
                </section>
            </div>
        </div>
    );
}

