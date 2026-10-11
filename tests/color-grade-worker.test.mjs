import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

async function runWorker(filePath, payload) {
  const source = await readFile(new URL(filePath, import.meta.url), "utf8");
  let posted;
  const self = {
    onmessage: null,
    postMessage(message) { posted = message; }
  };
  vm.runInNewContext(source, { self, Uint8ClampedArray, Float32Array, Math, Number, Error });
  self.onmessage({ data: payload });
  if (posted?.error) throw new Error(posted.error);
  return posted;
}

test("identity 3D LUT worker preserves image values and alpha", async () => {
  const size = 16;
  const lut = new Float32Array(size * size * size * 3);
  let cursor = 0;
  for (let b = 0; b < size; b += 1) {
    for (let g = 0; g < size; g += 1) {
      for (let r = 0; r < size; r += 1) {
        lut[cursor++] = r / (size - 1);
        lut[cursor++] = g / (size - 1);
        lut[cursor++] = b / (size - 1);
      }
    }
  }

  const source = new Uint8ClampedArray([12, 90, 180, 255, 240, 30, 60, 128, 9, 10, 11, 0]);
  const expected = [...source];
  const response = await runWorker("../public/workers/color-grade.worker.js", {
    pixelBuffer: source.buffer,
    lutBuffer: lut.buffer,
    intensity: 100,
    lutSize: size
  });
  const actual = [...new Uint8ClampedArray(response.buffer)];
  assert.equal(actual[3], expected[3]);
  assert.equal(actual[7], expected[7]);
  assert.equal(actual[11], expected[11]);
  for (let i = 0; i < expected.length; i += 1) {
    if (i % 4 !== 3) assert.ok(Math.abs(actual[i] - expected[i]) <= 1, `channel ${i}: expected ${expected[i]}, received ${actual[i]}`);
  }
});
