/* Full-resolution LUT application runs off the UI thread. */
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function srgbToLinearChannel(value) {
  const v = value / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function linearToSrgbChannel(value) {
  const v = value <= 0.0031308
    ? value * 12.92
    : 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
  return v * 255;
}

function lutIndex(size, r, g, b) {
  return ((b * size + g) * size + r) * 3;
}

function trilinearSample(lut, size, r, g, b, out) {
  const max = size - 1;
  const x = clamp(r, 0, 1) * max;
  const y = clamp(g, 0, 1) * max;
  const z = clamp(b, 0, 1) * max;
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const z0 = Math.floor(z);
  const x1 = Math.min(x0 + 1, max);
  const y1 = Math.min(y0 + 1, max);
  const z1 = Math.min(z0 + 1, max);
  const tx = x - x0;
  const ty = y - y0;
  const tz = z - z0;
  const idx000 = lutIndex(size, x0, y0, z0);
  const idx100 = lutIndex(size, x1, y0, z0);
  const idx010 = lutIndex(size, x0, y1, z0);
  const idx110 = lutIndex(size, x1, y1, z0);
  const idx001 = lutIndex(size, x0, y0, z1);
  const idx101 = lutIndex(size, x1, y0, z1);
  const idx011 = lutIndex(size, x0, y1, z1);
  const idx111 = lutIndex(size, x1, y1, z1);

  for (let c = 0; c < 3; c += 1) {
    const c000 = lut[idx000 + c];
    const c100 = lut[idx100 + c];
    const c010 = lut[idx010 + c];
    const c110 = lut[idx110 + c];
    const c001 = lut[idx001 + c];
    const c101 = lut[idx101 + c];
    const c011 = lut[idx011 + c];
    const c111 = lut[idx111 + c];
    const c00 = c000 + (c100 - c000) * tx;
    const c10 = c010 + (c110 - c010) * tx;
    const c01 = c001 + (c101 - c001) * tx;
    const c11 = c011 + (c111 - c011) * tx;
    const c0 = c00 + (c10 - c00) * ty;
    const c1 = c01 + (c11 - c01) * ty;
    out[c] = c0 + (c1 - c0) * tz;
  }
}

self.onmessage = (event) => {
  try {
    const { pixelBuffer, lutBuffer, intensity, lutSize } = event.data;
    const pixels = new Uint8ClampedArray(pixelBuffer);
    const lut = new Float32Array(lutBuffer);
    const strength = clamp(Number(intensity) / 100, 0, 1);
    const sample = new Float32Array(3);

    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      trilinearSample(
        lut,
        lutSize,
        srgbToLinearChannel(r),
        srgbToLinearChannel(g),
        srgbToLinearChannel(b),
        sample
      );
      pixels[i] = clamp(lerp(r, linearToSrgbChannel(sample[0]), strength), 0, 255);
      pixels[i + 1] = clamp(lerp(g, linearToSrgbChannel(sample[1]), strength), 0, 255);
      pixels[i + 2] = clamp(lerp(b, linearToSrgbChannel(sample[2]), strength), 0, 255);
      // Preserve alpha.
    }

    self.postMessage({ buffer: pixels.buffer }, [pixels.buffer]);
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : "Unknown worker error" });
  }
};
