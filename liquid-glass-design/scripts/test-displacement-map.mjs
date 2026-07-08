#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  createLiquidGlassDisplacementDataUri,
  createLiquidGlassDisplacementPixels,
  createLiquidGlassDisplacementPng
} from "./generate-displacement-map.mjs";

function hash(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function readPngSize(png) {
  return {
    width: png.readUInt32BE(16),
    height: png.readUInt32BE(20)
  };
}

const standard = createLiquidGlassDisplacementPng({ width: 96, height: 48, radius: 24, profile: "standard" });
const thin = createLiquidGlassDisplacementPng({ width: 96, height: 48, radius: 24, profile: "thin" });
const pixels = createLiquidGlassDisplacementPixels({ width: 64, height: 32, radius: 16, profile: "soft" });
const dataUri = createLiquidGlassDisplacementDataUri({ width: 64, height: 32, radius: 16, profile: "prominent" });

assert.deepEqual(Array.from(standard.subarray(0, 8)), [137, 80, 78, 71, 13, 10, 26, 10], "PNG signature should be valid");
assert.deepEqual(readPngSize(standard), { width: 96, height: 48 }, "IHDR should contain requested dimensions");
assert.ok(Number.isFinite(standard.liquidGlassScale) && standard.liquidGlassScale > 0, "PNG scale should be positive");
assert.ok(Number.isFinite(pixels.scale) && pixels.scale > 0, "pixel map scale should be positive");
assert.equal(pixels.data.length, 64 * 32 * 4, "pixel map should be RGBA");
assert.ok(dataUri.url.startsWith("data:image/png;base64,"), "data URI should be a PNG");
assert.notEqual(hash(standard), hash(thin), "different profiles should produce different maps");

console.log("displacement map tests passed");
