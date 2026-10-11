import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { processGrayscalePixels } from "../lib/grayscale-core.mjs";

async function runWorker(filePath, payload) {
  const source = await readFile(new URL(filePath, import.meta.url), "utf8");
  let posted;
  const self = {
    onmessage: null,
    postMessage(message) { posted = message; }
  };
  vm.runInNewContext(source, { self, Uint8ClampedArray, Math, Number, Error });
  self.onmessage({ data: payload });
  if (posted?.error) throw new Error(posted.error);
  return posted;
}

test("grayscale worker matches the preview core for the same input and controls", async () => {
  const source = new Uint8ClampedArray([255, 0, 0, 255, 80, 140, 210, 128, 4, 7, 15, 0]);
  const expected = source.slice();
  const controls = { intensity: 92, contrast: 13, brightness: -3, grain: 9, weights: true };
  processGrayscalePixels(expected, controls);

  const actualInput = source.slice();
  const response = await runWorker("../public/workers/grayscale.worker.js", {
    buffer: actualInput.buffer,
    controls
  });
  assert.deepEqual([...new Uint8ClampedArray(response.buffer)], [...expected]);
});
