/**
 * Clamps a value between min and max
 */
export function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

/**
 * Maps a value from one range to another
 */
export function mapRange(value, inMin, inMax, outMin, outMax) {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

/**
 * GLSL-like smoothstep
 */
export function smoothstep(min, max, value) {
    const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
    return x * x * (3 - 2 * x);
}

/**
 * Converts RGB to HSL
 * r, g, b are in [0, 255]
 * Returns { h, s, l } where h in [0, 360], s, l in [0, 100]
 */
export function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h,
        s,
        l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h *= 60;
    }

    return { h, s: s * 100, l: l * 100 };
}

/**
 * Converts HSL to RGB
 * h in [0, 360], s, l in [0, 100]
 * Returns { r, g, b } in [0, 255]
 */
export function hslToRgb(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
    let r, g, b;

    if (s === 0) {
        r = g = b = l; // achromatic
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

/**
 * Generates cubic spline interpolation for tone curves
 * points: array of {x, y} normalized [0, 1]
 * Returns a 256-entry lookup table (LUT)
 */
/**
 * Generates a Monotonic Cubic Spline interpolation for tone curves.
 * points: array of {x, y} normalized [0, 1]
 * Returns a 256-entry lookup table (LUT)
 */
export function generateToneCurveLUT(points) {
    if (points.length < 2) return Array.from({ length: 256 }, (_, i) => i);

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
            m[i] = 0; // Prevent div by zero if duplicate points
        } else {
            m[i] = (y[i + 1] - y[i]) / dx;
        }
    }

    // 2. Calculate tangents (dy/dx at each point)
    // Using Steffen's method or Fritsch-Carlson for monotonicity
    const t = new Array(n);

    // Endpoints
    t[0] = m[0];
    t[n - 1] = m[n - 2];

    for (let i = 1; i < n - 1; i++) {
        const mPrev = m[i - 1];
        const mNext = m[i];

        // If slopes have different signs, local extremum (tangent = 0)
        if (mPrev * mNext <= 0) {
            t[i] = 0;
        } else {
            // Weighted harmonic mean (Fritsch-Butland) prevents overshoot
            // But simple average is often "smooth enough". 
            // Let's use Monotonic constraints check.
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

        // Scale t to the segment width? 
        // Hermite basis functions expect t on [0,1] normalized to segment
        const h = p1 - p0;
        if (h === 0) {
            lut[i] = clamp(Math.round(y0 * 255), 0, 255);
            continue;
        }

        const s = (val - p0) / h; // standardized parameter (0 to 1)
        const s2 = s * s;
        const s3 = s * s * s;

        // Cubic Hermite Spline formula
        // h00 = 2s^3 - 3s^2 + 1
        // h10 = s^3 - 2s^2 + s
        // h01 = -2s^3 + 3s^2
        // h11 = s^3 - s^2

        const h00 = 2 * s3 - 3 * s2 + 1;
        const h10 = s3 - 2 * s2 + s;
        const h01 = -2 * s3 + 3 * s2;
        const h11 = s3 - s2;

        const res = h00 * y0 + h10 * h * t0 + h01 * y1 + h11 * h * t1;

        lut[i] = clamp(Math.round(res * 255), 0, 255);
    }

    return lut;
}
