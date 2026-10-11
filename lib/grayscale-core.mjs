export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function stableNoise(pixelIndex) {
  let value = (pixelIndex + 0x9e3779b9) >>> 0;
  value = Math.imul(value ^ (value >>> 16), 0x7feb352d);
  value = Math.imul(value ^ (value >>> 15), 0x846ca68b);
  value = (value ^ (value >>> 16)) >>> 0;
  return value / 0xffffffff;
}

/**
 * Mutates an ImageData-compatible RGBA typed array in place.
 * The grain is deterministic so changing another slider does not flicker the texture.
 */
export function processGrayscalePixels(pixels, controls) {
  if (!pixels || typeof pixels.length !== "number" || pixels.length % 4 !== 0) {
    throw new TypeError("Expected an RGBA pixel buffer.");
  }

  const intensity = clamp(Number(controls.intensity ?? 100) / 100, 0, 1);
  const contrast = clamp(Number(controls.contrast ?? 0), -100, 100);
  const brightness = clamp(Number(controls.brightness ?? 0), -255, 255);
  const grain = clamp(Number(controls.grain ?? 0), 0, 100);
  const useLuminanceWeights = controls.weights !== false;
  const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  const grainStrength = grain * 0.6;

  for (let i = 0, pixelIndex = 0; i < pixels.length; i += 4, pixelIndex += 1) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const luminance = useLuminanceWeights
      ? 0.2126 * r + 0.7152 * g + 0.0722 * b
      : (r + g + b) / 3;
    const mix = 1 - intensity;
    const noise = grain > 0 ? (stableNoise(pixelIndex) - 0.5) * grainStrength : 0;

    pixels[i] = clamp(contrastFactor * (r * mix + luminance * intensity - 128) + 128 + brightness + noise, 0, 255);
    pixels[i + 1] = clamp(contrastFactor * (g * mix + luminance * intensity - 128) + 128 + brightness + noise, 0, 255);
    pixels[i + 2] = clamp(contrastFactor * (b * mix + luminance * intensity - 128) + 128 + brightness + noise, 0, 255);
    // Keep the original alpha channel unchanged.
  }

  return pixels;
}
