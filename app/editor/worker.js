/* eslint-disable no-undef */

// --- UTILS (Inlined logic where possible, helpers for setup) ---

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function generateToneCurveLUT(points) {
    if (!points || points.length < 2) return new Uint8Array(Array.from({ length: 256 }, (_, i) => i));

    // Sort points by x
    const sorted = [...points].sort((a, b) => a.x - b.x);

    // Ensure endpoints exist
    if (sorted[0].x > 0) sorted.unshift({ x: 0, y: 0 });
    if (sorted[sorted.length - 1].x < 1) sorted.push({ x: 1, y: 1 });

    const n = sorted.length;
    const x = sorted.map(p => p.x);
    const y = sorted.map(p => p.y);

    // 1. Calculate secants (slopes between points)
    const m = new Array(n - 1);
    for (let i = 0; i < n - 1; i++) {
        const dx = x[i + 1] - x[i];
        if (dx === 0) {
            m[i] = 0;
        } else {
            m[i] = (y[i + 1] - y[i]) / dx;
        }
    }

    // 2. Calculate tangents
    const t = new Array(n);
    t[0] = m[0];
    t[n - 1] = m[n - 2];

    for (let i = 1; i < n - 1; i++) {
        const mPrev = m[i - 1];
        const mNext = m[i];
        if (mPrev * mNext <= 0) {
            t[i] = 0;
        } else {
            t[i] = (mPrev + mNext) / 2;
        }
    }

    // 3. Generate LUT
    const lut = new Uint8Array(256);
    let currentSegment = 0;

    for (let i = 0; i < 256; i++) {
        const val = i / 255;
        // Find correct segment
        while (currentSegment < n - 2 && val > x[currentSegment + 1]) {
            currentSegment++;
        }

        const p0 = x[currentSegment];
        const p1 = x[currentSegment + 1];
        const y0 = y[currentSegment];
        const y1 = y[currentSegment + 1];
        const t0 = t[currentSegment];
        const t1 = t[currentSegment + 1];

        const h = p1 - p0;
        if (h === 0) {
            lut[i] = clamp(Math.round(y0 * 255), 0, 255);
            continue;
        }

        const s = (val - p0) / h;
        const s2 = s * s;
        const s3 = s * s * s;

        const h00 = 2 * s3 - 3 * s2 + 1;
        const h10 = s3 - 2 * s2 + s;
        const h01 = -2 * s3 + 3 * s2;
        const h11 = s3 - s2;

        const res = h00 * y0 + h10 * h * t0 + h01 * y1 + h11 * h * t1;
        lut[i] = clamp(Math.round(res * 255), 0, 255);
    }

    return lut;
}

// --- HELPER: HSL to RGB (Returns object, used only for pre-calc) ---
function hslToRgbObj(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
    let r, g, b;

    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;

        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}


// --- WORKER MESSAGE HANDLER ---

// --- WORKER STATE ---
let sourceData = null;
let sourceWidth = 0;
let sourceHeight = 0;

// --- WORKER MESSAGE HANDLER ---

self.onmessage = function (e) {
    const msg = e.data;

    if (msg.type === "SET_SOURCE") {
        const { imageData } = msg;
        // Store the source data (we own this buffer now if transferred, or it's a copy)
        sourceData = imageData.data;
        sourceWidth = imageData.width;
        sourceHeight = imageData.height;

        // Optional: Immediately process with current params if provided? 
        // For now, just ack or wait for next PROCESS msg.
        return;
    }

    if (msg.type === "PROCESS") {
        if (!sourceData) return;

        const { params } = msg;

        // 1. Create a working copy (This copy happens on Worker Thread, unblocking Main Thread)
        const outputBuffer = new Uint8ClampedArray(sourceData);
        const outputImageData = new ImageData(outputBuffer, sourceWidth, sourceHeight);

        // 2. Process pixels
        processPixels(outputImageData, params);

        // 3. Send back
        self.postMessage({
            imageData: outputImageData,
            jobId: msg.jobId
        }, [outputImageData.data.buffer]);
        return;
    }

    // Legacy/Fallback (if needed, but usually we strictly use the new types)
    if (msg.imageData && msg.params) {
        // One-off mode (stateless)
        processPixels(msg.imageData, msg.params);
        self.postMessage({ imageData: msg.imageData }, [msg.imageData.data.buffer]);
    }
};

// --- PROCESSING LOGIC ---

function processPixels(imageData, params) {
    const data = imageData.data;
    const len = data.length;
    const width = imageData.width;
    const height = imageData.height;

    // -- Pre-calculate LUTs & Factors --
    const curveLutMaster = generateToneCurveLUT(params.curveMaster);
    const curveLutRed = generateToneCurveLUT(params.curveRed);
    const curveLutGreen = generateToneCurveLUT(params.curveGreen);
    const curveLutBlue = generateToneCurveLUT(params.curveBlue);

    // Lookups for fast access
    const contrastF = (259 * (params.contrast + 255)) / (255 * (259 - params.contrast));
    const exposureF = Math.pow(2, params.exposure);

    // Highlights/Shadows ranges
    const highlightsF = (params.highlights / 100);
    const shadowsF = (params.shadows / 100);

    // Dehaze / Vignette
    const dehazeF = params.dehaze / 100;
    const centerX = width / 2;
    const centerY = height / 2;
    const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
    const vigStr = params.vignette / 100;
    const grainStr = params.grain;

    // -- PRE-CALC COLOR GRADING TINTS --
    const grading = params.colorGrading;
    const mixer = params.colorMixer;

    // Optimized: Pre-calculate the tint colors (r,g,b offset from gray-128)
    // Tint formula: (col - 128) * strength
    // We store (col - 128) here, and multiply by strength per-pixel

    const getTintBase = (colorObj) => {
        if (colorObj.s === 0) return { r: 0, g: 0, b: 0 }; // No saturation = no tint
        const c = hslToRgbObj(colorObj.h, colorObj.s, 50);
        return {
            r: (c.r - 128),
            g: (c.g - 128),
            b: (c.b - 128)
        };
    };

    const tintS_Base = getTintBase(grading.shadows);
    const tintM_Base = getTintBase(grading.midtones);
    const tintH_Base = getTintBase(grading.highlights);

    const gradBalance = clamp(grading.balance, -100, 100) / 100;
    const gradBlending = clamp(grading.blending, 0, 100) / 100;
    const gradCenter = clamp(0.5 + (gradBalance * 0.25), 0.2, 0.8);
    // Avoid divide by zero by ensuring widthW is at least tiny
    // const widthW = clamp(0.2 + (gradBlending * 0.8), 0.01, 1.0); 

    // Mixer Channels for fast iteration
    const mixerChannels = [
        { adj: mixer.red, t: 0, w: 25 },
        { adj: mixer.red, t: 360, w: 25 },
        { adj: mixer.orange, t: 30, w: 25 },
        { adj: mixer.yellow, t: 60, w: 25 },
        { adj: mixer.green, t: 105, w: 35 },
        { adj: mixer.aqua, t: 150, w: 30 },
        { adj: mixer.blue, t: 210, w: 40 },
        { adj: mixer.purple, t: 270, w: 35 },
        { adj: mixer.magenta, t: 300, w: 35 }
    ];

    // -- PIXEL LOOP --
    // Variables declared outside to avoid allocation
    let r, g, b;
    let luma;
    let strength, boost;
    let h, s, lum, max, min, d;
    let dH, dS, dL, totalWeight, weight, diff;
    let safeL, t, wS, wM, wH;
    let q, p;
    let hk, tr, tg, tb;

    const div255 = 1 / 255;

    for (let i = 0; i < len; i += 4) {
        r = data[i];
        g = data[i + 1];
        b = data[i + 2];
        // data[i+3] is alpha

        // -- LIGHT --

        // Exposure
        r *= exposureF;
        g *= exposureF;
        b *= exposureF;

        // Contrast
        r = contrastF * (r - 128) + 128;
        g = contrastF * (g - 128) + 128;
        b = contrastF * (b - 128) + 128;

        // Highlights / Shadows
        luma = 0.299 * r + 0.587 * g + 0.114 * b;

        if (luma < 128) {
            strength = 1 - (luma / 128);
            boost = strength * shadowsF * 50;
            r += boost; g += boost; b += boost;
        } else {
            strength = (luma - 128) / 127;
            boost = strength * highlightsF * 50;
            r += boost; g += boost; b += boost;
        }

        // Whites / Blacks
        r += params.whites * (luma * div255);
        r += params.blacks * (1 - luma * div255);
        g += params.whites * (luma * div255);
        g += params.blacks * (1 - luma * div255);
        b += params.whites * (luma * div255);
        b += params.blacks * (1 - luma * div255);

        // -- CURVES --
        r = clamp(r, 0, 255);
        g = clamp(g, 0, 255);
        b = clamp(b, 0, 255);

        r = curveLutRed[Math.round(r)];
        g = curveLutGreen[Math.round(g)];
        b = curveLutBlue[Math.round(b)];

        // Master applied to all
        r = curveLutMaster[Math.round(r)];
        g = curveLutMaster[Math.round(g)];
        b = curveLutMaster[Math.round(b)];

        // -- COLOR (Inline RGB<->HSL) --

        // RGB to HSL Inline
        let r0 = r * div255, g0 = g * div255, b0 = b * div255;
        max = Math.max(r0, g0, b0);
        min = Math.min(r0, g0, b0);
        lum = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            d = max - min;
            s = lum > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r0: h = (g0 - b0) / d + (g0 < b0 ? 6 : 0); break;
                case g0: h = (b0 - r0) / d + 2; break;
                case b0: h = (r0 - g0) / d + 4; break;
            }
            h *= 60;
        }
        s *= 100;
        lum *= 100;

        // Color Mixer
        dH = 0; dS = 0; dL = 0; totalWeight = 0;

        for (let j = 0; j < 9; j++) {
            const ch = mixerChannels[j];
            // getHueWeight Inline
            diff = Math.abs(h - ch.t);
            if (diff > 180) diff = 360 - diff;

            if (diff < ch.w) {
                weight = (Math.cos((diff / ch.w) * Math.PI) + 1) / 2;
                if (weight > 0) {
                    if (ch.adj) {
                        dH += ch.adj.h * weight;
                        dS += ch.adj.s * weight;
                        dL += ch.adj.l * weight;
                        totalWeight += weight;
                    }
                }
            }
        }

        if (totalWeight > 0) {
            h = (h + dH + 360) % 360;
            s = clamp(s + dS, 0, 100);
            lum = clamp(lum + dL, 0, 100);

            // HSL to RGB Inline
            let h1 = h / 360;
            let s1 = s / 100;
            let l1 = lum / 100;

            if (s1 === 0) {
                r = g = b = l1 * 255;
            } else {
                q = l1 < 0.5 ? l1 * (1 + s1) : l1 + s1 - l1 * s1;
                p = 2 * l1 - q;

                const hue2rgb_inner = (t) => {
                    if (t < 0) t += 1;
                    if (t > 1) t -= 1;
                    if (t < 1 / 6) return p + (q - p) * 6 * t;
                    if (t < 1 / 2) return q;
                    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                    return p;
                };

                r = hue2rgb_inner(h1 + 0.3333) * 255;
                g = hue2rgb_inner(h1) * 255;
                b = hue2rgb_inner(h1 - 0.3333) * 255;
            }
        }

        // Color Grading
        safeL = clamp(lum, 0, 100) / 100;

        // Weights
        if (safeL < gradCenter) {
            t = safeL / Math.max(0.001, gradCenter);
            wM = t; wS = 1 - t; wH = 0;
        } else {
            t = (safeL - gradCenter) / Math.max(0.001, (1 - gradCenter));
            wH = t; wM = 1 - t; wS = 0;
        }

        // Apply pre-calculated tints
        // Tint = (col - 128) * strength
        // strength = weight * (s / 100)

        let tR = 0, tG = 0, tB = 0;

        // Shadows
        if (wS > 0.001 && grading.shadows.s > 0) {
            const str = wS * (grading.shadows.s / 100);
            tR += tintS_Base.r * str;
            tG += tintS_Base.g * str;
            tB += tintS_Base.b * str;
        }
        // Midtones
        if (wM > 0.001 && grading.midtones.s > 0) {
            const str = wM * (grading.midtones.s / 100);
            tR += tintM_Base.r * str;
            tG += tintM_Base.g * str;
            tB += tintM_Base.b * str;
        }
        // Highlights
        if (wH > 0.001 && grading.highlights.s > 0) {
            const str = wH * (grading.highlights.s / 100);
            tR += tintH_Base.r * str;
            tG += tintH_Base.g * str;
            tB += tintH_Base.b * str;
        }

        r += tR; g += tG; b += tB;


        // Global Saturation & Dehaze Saturation
        if (params.saturation !== 0 || dehazeF !== 0) {
            // Re-calc luma if needed? Roughly 
            let l2 = 0.299 * r + 0.587 * g + 0.114 * b;
            let sFactor = 1 + (params.saturation / 100) + (dehazeF * 0.3);
            r = l2 + (r - l2) * sFactor;
            g = l2 + (g - l2) * sFactor;
            b = l2 + (b - l2) * sFactor;
        }

        // -- EFFECTS --

        // Dehaze
        if (params.dehaze !== 0) {
            // Re-calc luma?
            // Use initial luma for approximation or current? Stick to current approx
            let l3 = 0.299 * r + 0.587 * g + 0.114 * b;
            r = r + (l3 - 128) * dehazeF * 0.5;
            g = g + (l3 - 128) * dehazeF * 0.5;
            b = b + (l3 - 128) * dehazeF * 0.5;
        }

        // Vignette
        if (params.vignette !== 0) {
            // Integer coordinate math
            const px = (i / 4) % width;
            const py = Math.floor((i / 4) / width);
            const dist = Math.sqrt((px - centerX) ** 2 + (py - centerY) ** 2);
            const normDist = dist / maxDist;

            if (vigStr < 0) {
                const falloff = 1 + (vigStr * (normDist * normDist * normDist));
                r *= falloff; g *= falloff; b *= falloff;
            } else {
                const falloff = vigStr * (normDist * normDist);
                r += (255 - r) * falloff;
                g += (255 - g) * falloff;
                b += (255 - b) * falloff;
            }
        }

        // Grain
        if (grainStr > 0) {
            const noise = (Math.random() - 0.5) * grainStr;
            r += noise;
            g += noise;
            b += noise;
        }

        data[i] = clamp(r, 0, 255);
        data[i + 1] = clamp(g, 0, 255);
        data[i + 2] = clamp(b, 0, 255);
    }

    // -- CONVOLUTION EFFECTS --
    // These are inherently slow (O(N)), but they only run if > 0
    if (params.noise > 0) {
        applyDenoise(imageData, params.noise / 100);
    }
    if (params.sharpen > 0) {
        applySharpen(imageData, params.sharpen / 100);
    }
}

function applyDenoise(imageData, amount) {
    if (amount <= 0) return;
    const w = imageData.width;
    const h = imageData.height;
    const data = imageData.data;
    const buff = new Uint8ClampedArray(data); // This copy is unavoidable for convolution

    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            const i = (y * w + x) * 4;
            // Pre-calculate offsets
            const up = i - w * 4;
            const down = i + w * 4;
            const left = i - 4;
            const right = i + 4;
            const ul = up - 4;
            const ur = up + 4;
            const dl = down - 4;
            const dr = down + 4;

            for (let ch = 0; ch < 3; ch++) {
                const blurVal = (
                    buff[ul + ch] * 1 + buff[up + ch] * 2 + buff[ur + ch] * 1 +
                    buff[left + ch] * 2 + buff[i + ch] * 4 + buff[right + ch] * 2 +
                    buff[dl + ch] * 1 + buff[down + ch] * 2 + buff[dr + ch] * 1
                ) * 0.0625; // / 16

                const val = buff[i + ch] * (1 - amount) + blurVal * amount;
                data[i + ch] = clamp(Math.round(val), 0, 255);
            }
        }
    }
}

function applySharpen(imageData, amount) {
    if (amount <= 0) return;
    const w = imageData.width;
    const h = imageData.height;
    const data = imageData.data;
    const buff = new Uint8ClampedArray(data);

    const k = -1 * amount;
    const c = 4 * amount + 1;

    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            const i = (y * w + x) * 4;
            const up = i - w * 4;
            const down = i + w * 4;
            const left = i - 4;
            const right = i + 4;

            for (let ch = 0; ch < 3; ch++) {
                const val =
                    buff[up + ch] * k +
                    buff[down + ch] * k +
                    buff[left + ch] * k +
                    buff[right + ch] * k +
                    buff[i + ch] * c;
                data[i + ch] = clamp(val, 0, 255);
            }
        }
    }
}

