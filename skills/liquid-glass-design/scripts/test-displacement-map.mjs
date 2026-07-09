#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  createLiquidGlassDisplacementDataUri,
  createLiquidGlassDisplacementPixels,
  createLiquidGlassDisplacementPng
} from "./generate-displacement-map.mjs";
import {
  computeAdaptiveLiquidGlassVars,
  isKnownBackdropSvgFilterUnsupported,
  parseCssColor,
  relativeLuminance
} from "../assets/core/liquid-glass-core.js";

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
const standardPixels = createLiquidGlassDisplacementPixels({ width: 96, height: 48, radius: 24, profile: "standard" });
const thinPixels = createLiquidGlassDisplacementPixels({ width: 96, height: 48, radius: 24, profile: "thin" });
const pixels = createLiquidGlassDisplacementPixels({ width: 64, height: 32, radius: 16, profile: "soft" });
const dataUri = createLiquidGlassDisplacementDataUri({ width: 64, height: 32, radius: 16, profile: "prominent" });

assert.deepEqual(Array.from(standard.subarray(0, 8)), [137, 80, 78, 71, 13, 10, 26, 10], "PNG signature should be valid");
assert.deepEqual(readPngSize(standard), { width: 96, height: 48 }, "IHDR should contain requested dimensions");
assert.ok(Number.isFinite(standard.liquidGlassScale) && standard.liquidGlassScale > 0, "PNG scale should be positive");
assert.ok(Number.isFinite(pixels.scale) && pixels.scale > 0, "pixel map scale should be positive");
assert.equal(pixels.data.length, 64 * 32 * 4, "pixel map should be RGBA");
assert.equal(pixels.data[2], 0, "blue channel should stay neutral because the filter reads R/G only");
assert.ok(dataUri.url.startsWith("data:image/png;base64,"), "data URI should be a PNG");
assert.notEqual(hash(standardPixels.data), hash(thinPixels.data), "different profiles should produce different raw maps");
assert.equal(hash(standardPixels.data), "554f3cd70a221db73e590f53febc853a090857c40e9bf36ac8e43a2521511dee", "core raw map pixels should stay deterministic");
assert.ok(relativeLuminance(parseCssColor("rgb(255, 255, 255)")) > relativeLuminance(parseCssColor("rgb(0, 0, 0)")), "white should measure brighter than black");
assert.equal(parseCssColor("rgb(255 255 255 / 50%)").a, 0.5, "modern CSS alpha percentages should parse");
assert.equal(computeAdaptiveLiquidGlassVars(0.82).mode, "bright", "bright backdrops should use bright mode");
assert.equal(computeAdaptiveLiquidGlassVars(0.12).mode, "dark", "dark backdrops should use dark mode");
assert.notEqual(computeAdaptiveLiquidGlassVars(0.82).variables["--lg-adaptive-tint"], computeAdaptiveLiquidGlassVars(0.12).variables["--lg-adaptive-tint"], "adaptive tint should change with luminance");
assert.equal(isKnownBackdropSvgFilterUnsupported("Mozilla/5.0 AppleWebKit/605.1.15 Version/17.4 Safari/605.1.15"), true, "Safari must use fallback until SVG backdrop filters render correctly");
assert.equal(isKnownBackdropSvgFilterUnsupported("Mozilla/5.0 Firefox/128.0"), true, "Firefox must use fallback until SVG backdrop filters render correctly");
assert.equal(isKnownBackdropSvgFilterUnsupported("Mozilla/5.0 Chrome/126.0.0.0 Safari/537.36"), false, "Chromium should use SVG refraction when syntax support is present");
assert.equal(isKnownBackdropSvgFilterUnsupported("Mozilla/5.0 AppleWebKit/537.36 HeadlessChrome/126.0.0.0 Safari/537.36"), false, "Headless Chromium in CI should not be mistaken for Safari");

console.log("displacement map tests passed");
