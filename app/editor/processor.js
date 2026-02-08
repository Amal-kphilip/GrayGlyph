export const DEFAULT_EDITOR_STATE = {
    // Geometry
    rotate: 0, // 0, 90, 180, 270
    flipH: false,
    flipV: false,
    straighten: 0, // -45 to 45 degrees
    crop: null, // { x, y, width, height } normalized 0-1. Null means full image.

    // Light
    exposure: 0,   // -5 to 5
    contrast: 0,   // -100 to 100
    highlights: 0, // -100 to 100
    shadows: 0,    // -100 to 100
    whites: 0,     // -100 to 100
    blacks: 0,     // -100 to 100

    // Color
    temperature: 0, // -100 to 100
    tint: 0,        // -100 to 100
    saturation: 0,  // -100 to 100
    colorMixer: {
        red: { h: 0, s: 0, l: 0 },
        orange: { h: 0, s: 0, l: 0 },
        yellow: { h: 0, s: 0, l: 0 },
        green: { h: 0, s: 0, l: 0 },
        aqua: { h: 0, s: 0, l: 0 },
        blue: { h: 0, s: 0, l: 0 },
        purple: { h: 0, s: 0, l: 0 },
        magenta: { h: 0, s: 0, l: 0 },
    },
    colorGrading: {
        shadows: { h: 0, s: 0, l: 0 },
        midtones: { h: 0, s: 0, l: 0 },
        highlights: { h: 0, s: 0, l: 0 },
        blending: 50, // 0-100
        balance: 0,   // -100 to 100
    },

    // Curves
    curveMaster: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
    curveRed: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
    curveGreen: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
    curveBlue: [{ x: 0, y: 0 }, { x: 1, y: 1 }],

    // Effects
    texture: 0,
    clarity: 0,
    dehaze: 0,
    vignette: 0,
    grain: 0,

    // Detail
    sharpen: 0,
    noise: 0
};

// Singleton Worker Instance
let worker = null;
let currentJobId = 0;

function getWorker() {
    if (!worker && typeof window !== 'undefined') {
        worker = new Worker(new URL('./worker.js', import.meta.url));
    }
    return worker;
}

/**
 * Checks if geometry parameters have changed
 */
export function hasGeometryChanged(oldParams, newParams) {
    if (!oldParams) return true;
    return oldParams.rotate !== newParams.rotate ||
        oldParams.flipH !== newParams.flipH ||
        oldParams.flipV !== newParams.flipV ||
        oldParams.straighten !== newParams.straighten ||
        oldParams.crop !== newParams.crop;
}

/**
 * Applies Geometry (Rotate, Flip) to source image and returns ImageData.
 * This runs on the Main Thread because Canvas API is highly optimized for this.
 */
/**
 * Applies Geometry (Crop -> Rotate -> Flip) to source image and returns ImageData.
 * Pipeline: Source -> Crop -> Rotate -> Flip
 */
export function applyGeometry(sourceImg, targetCanvas, params) {
    if (!sourceImg || !targetCanvas) return null;

    const ctx = targetCanvas.getContext("2d", { willReadFrequently: true });
    const sourceW = sourceImg.naturalWidth || sourceImg.width;
    const sourceH = sourceImg.naturalHeight || sourceImg.height;
    if (!sourceW || !sourceH) return null;

    // 1. Calculate Source Rectangle (Crop)
    // crop is { x, y, width, height } in normalized percentage (0-1)
    let sx = 0, sy = 0, sw = sourceW, sh = sourceH;

    if (params.crop) {
        sx = Math.round(params.crop.x * sourceW);
        sy = Math.round(params.crop.y * sourceH);
        sw = Math.round(params.crop.width * sourceW);
        sh = Math.round(params.crop.height * sourceH);

        // Safety clamps
        if (sx < 0) sx = 0;
        if (sy < 0) sy = 0;
        if (sw > sourceW - sx) sw = sourceW - sx;
        if (sh > sourceH - sy) sh = sourceH - sy;
    }

    // 2. Determine Output Dimensions based on Rotation of the CROPPED area
    // If rotated 90/270, width/height swap
    let dim = { w: sw, h: sh };
    const isRotated90 = Math.abs(params.rotate % 180) === 90;

    if (isRotated90) {
        dim = { w: sh, h: sw };
    }

    // Resize canvas to fit the transformed result
    if (targetCanvas.width !== dim.w || targetCanvas.height !== dim.h) {
        targetCanvas.width = dim.w;
        targetCanvas.height = dim.h;
    }

    // 3. Draw with Transformations
    ctx.save();
    ctx.clearRect(0, 0, dim.w, dim.h);

    // Move to center of canvas
    ctx.translate(dim.w / 2, dim.h / 2);

    // Apply Rotation & Straighten
    ctx.rotate((params.rotate * Math.PI) / 180);
    ctx.rotate((params.straighten * Math.PI) / 180);

    // Apply Flip
    const scaleX = params.flipH ? -1 : 1;
    const scaleY = params.flipV ? -1 : 1;
    ctx.scale(scaleX, scaleY);

    // Draw the cropped portion centered
    // Since we translated to center, we draw at -sw/2, -sh/2
    ctx.drawImage(
        sourceImg,
        sx, sy, sw, sh,      // Source Rect
        -sw / 2, -sh / 2, sw, sh // Destination Rect (relative to center)
    );

    ctx.restore();

    return ctx.getImageData(0, 0, dim.w, dim.h);
}

/**
 * Updates the Worker's source image.
 * Call this ONLY when the image actually changes (new file or geometry change).
 * This transfers ownership of the buffer to the worker.
 */
export function updateWorkerSource(imageData) {
    const w = getWorker();
    if (!w || !imageData) return;

    // We must clone if we want to keep a copy on main thread? 
    // Actually, usually we generate a fresh imageData from canvas for this purpose.
    // Let's assume the caller provides a buffer they are okay with detaching 
    // OR we copy it here. 
    // To be safe and avoid "Source Cache" becoming empty in Page.js, we copy.
    const bufferCopy = new Uint8ClampedArray(imageData.data);
    const dataToSend = new ImageData(bufferCopy, imageData.width, imageData.height);

    w.postMessage({
        type: "SET_SOURCE",
        imageData: dataToSend
    }, [dataToSend.data.buffer]);
}

/**
 * Offload pixel processing to Web Worker.
 * Now lightweight: Only sends params. 
 * Worker uses its cached source.
 */
export async function processPixels(params) {
    const w = getWorker();
    if (!w) return;

    return new Promise((resolve) => {
        const jobId = ++currentJobId;

        const handleMsg = (e) => {
            if (e.data.jobId === jobId) {
                w.removeEventListener("message", handleMsg);
                resolve(e.data.imageData);
            }
        };
        w.addEventListener("message", handleMsg);

        // Simple debounce/cancellation could be handled by the worker rejecting old jobIds
        // but for now we just rely on latest-result winning in the UI layer.

        w.postMessage({
            type: "PROCESS",
            params: JSON.parse(JSON.stringify(params)), // strip proxies if any
            jobId
        });
    });
}
