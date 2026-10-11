import test from "node:test";
import assert from "node:assert/strict";
import { processGrayscalePixels } from "../lib/grayscale-core.mjs";
import { validateImageDimensions, validateImageFile } from "../lib/image-validation.mjs";
import { getDownloadFormat } from "../lib/export-format.mjs";

const noEffects = { intensity: 0, contrast: 0, brightness: 0, grain: 0, weights: true };

test("grayscale core leaves pixels unchanged when all effects are neutral", () => {
  const pixels = new Uint8ClampedArray([12, 90, 180, 255, 240, 30, 60, 128]);
  const original = pixels.slice();
  processGrayscalePixels(pixels, noEffects);
  assert.deepEqual([...pixels], [...original]);
});

test("full grayscale intensity makes RGB channels equal and preserves alpha", () => {
  const pixels = new Uint8ClampedArray([255, 0, 0, 19, 0, 255, 0, 203]);
  processGrayscalePixels(pixels, { intensity: 100, contrast: 0, brightness: 0, grain: 0 });
  assert.equal(pixels[0], pixels[1]);
  assert.equal(pixels[1], pixels[2]);
  assert.equal(pixels[4], pixels[5]);
  assert.equal(pixels[5], pixels[6]);
  assert.equal(pixels[3], 19);
  assert.equal(pixels[7], 203);
});

test("grain is deterministic across repeated renders", () => {
  const source = new Uint8ClampedArray([110, 140, 170, 255, 60, 80, 100, 255]);
  const first = source.slice();
  const second = source.slice();
  const settings = { intensity: 100, contrast: 8, brightness: 4, grain: 16 };
  processGrayscalePixels(first, settings);
  processGrayscalePixels(second, settings);
  assert.deepEqual([...first], [...second]);
});

test("image dimensions enforce edge and megapixel caps", () => {
  assert.doesNotThrow(() => validateImageDimensions(4000, 3000));
  assert.throws(() => validateImageDimensions(6000, 4000), /20 megapixels/);
  assert.throws(() => validateImageDimensions(13000, 100), /12,000 pixels per side/);
});

test("image file validation rejects non-images and files above 40 MB", () => {
  assert.doesNotThrow(() => validateImageFile({ type: "image/png", size: 1024 }));
  assert.throws(() => validateImageFile({ type: "text/plain", size: 10 }), /not recognized as an image/);
  assert.throws(() => validateImageFile({ type: "image/jpeg", size: 41 * 1024 * 1024 }), /larger than 40 MB/);
});


test("export format always matches the encoded MIME type", () => {
  assert.deepEqual(getDownloadFormat("image/gif", "gif"), { mime: "image/png", extension: "png" });
  assert.deepEqual(getDownloadFormat("image/jpeg", "png"), { mime: "image/jpeg", extension: "jpg" });
  assert.deepEqual(getDownloadFormat("image/webp", "webp"), { mime: "image/webp", extension: "webp" });
  assert.deepEqual(getDownloadFormat("application/octet-stream", "jpeg"), { mime: "image/jpeg", extension: "jpeg" });
});
