#!/usr/bin/env node

/**
 * Zero-dependency Liquid Glass displacement map generator.
 *
 * Inverse lens mapping: the interior stays identity, a bezel band near the
 * border pulls samples toward the center (edge magnification). R encodes X,
 * G encodes Y around neutral 128. The output includes the measured
 * feDisplacementMap `scale` — apply it verbatim, do not guess strength.
 */

import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { deflateSync } from "node:zlib";

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
let crcTable;

function clamp(value, min, max) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return min;
  return Math.max(min, Math.min(max, numeric));
}

function numberOption(value, fallback, min, max) {
  if (value === undefined || value === null || value === "") return fallback;
  return clamp(value, min, max);
}

function smoothStep(edge0, edge1, value) {
  const t = clamp((value - edge0) / (edge1 - edge0 || 1), 0, 1);
  return t * t * (3 - 2 * t);
}

function roundedRectSdf(px, py, width, height, radius) {
  const cx = px - width / 2;
  const cy = py - height / 2;
  const hx = Math.max(0, width / 2 - radius);
  const hy = Math.max(0, height / 2 - radius);
  const qx = Math.abs(cx) - hx;
  const qy = Math.abs(cy) - hy;
  const inner = Math.min(Math.max(qx, qy), 0);
  const outer = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
  return inner + outer - radius;
}

function profileCurve(value, profile = "standard") {
  const eased = smoothStep(0, 1, value);
  switch (profile) {
    case "soft":
      return eased * 0.78;
    case "prominent":
      return Math.pow(eased, 0.72);
    case "thin":
      return Math.pow(eased, 1.45);
    default:
      return eased;
  }
}

function normalizeOptions(options = {}) {
  const width = Math.max(24, Math.round(numberOption(options.width, 400, 24, 4096)));
  const height = Math.max(24, Math.round(numberOption(options.height, 96, 24, 4096)));
  const radius = Math.round(clamp(numberOption(options.radius, Math.min(width, height) / 2, 0, 2048), 0, Math.min(width, height) / 2));
  const magnify = numberOption(options.magnify, 1, 0.2, 2);
  const bend = numberOption(options.bend, 0.06, 0, 0.3);
  const spread = numberOption(options.spread, 0.58, 0.4, 1);
  const bezelRatio = numberOption(options.bezelRatio, 0.62, 0.2, 1);
  const profile = String(options.profile || "standard");

  return { width, height, radius, magnify, bend, spread, bezelRatio, profile };
}

/**
 * Compute the displacement field and encode it as RGBA pixels.
 * Returns { width, height, data, scale } — `scale` is the exact value for
 * feDisplacementMap when the map is stretched over the same box.
 */
export function createLiquidGlassDisplacementPixels(options = {}) {
  const { width, height, radius, magnify, bend, spread, bezelRatio, profile } = normalizeOptions(options);
  const shortSide = Math.min(width, height);
  const bezel = clamp(shortSide * 0.5 * bezelRatio, 10, 220);
  const cx = width / 2;
  const cy = height / 2;
  const raw = new Float32Array(width * height * 2);
  let maxDisplacement = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const px = x + 0.5;
      const py = y + 0.5;
      const d = roundedRectSdf(px, py, width, height, radius);
      let dx = 0;
      let dy = 0;

      if (d > -bezel) {
        const pull = smoothStep(-bezel, 0, Math.min(d, 0));
        const eased = profileCurve(pull, profile);
        const ox = (px - cx) / (width / 2);
        const oy = (py - cy) / (height / 2);
        dx = -ox * eased * magnify * bezel;
        dy = -oy * eased * magnify * bezel;
        dx += Math.sin(((px / width) - 0.5) * Math.PI) * bend * bezel * eased;
        dy += Math.sin(((py / height) - 0.5) * Math.PI) * bend * bezel * eased;
      }

      const index = (y * width + x) * 2;
      raw[index] = dx;
      raw[index + 1] = dy;
      maxDisplacement = Math.max(maxDisplacement, Math.abs(dx), Math.abs(dy));
    }
  }

  const range = Math.max(1, maxDisplacement * spread);
  const data = new Uint8Array(width * height * 4);
  let rawIndex = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const dx = raw[rawIndex];
      const dy = raw[rawIndex + 1];
      rawIndex += 2;
      const edgeDistance = Math.min(x, y, width - x - 1, height - y - 1);
      const edgeFactor = smoothStep(0, 3, edgeDistance);
      const pixel = (y * width + x) * 4;
      data[pixel] = Math.round(clamp((dx * edgeFactor) / range * 0.5 + 0.5, 0, 1) * 255);
      data[pixel + 1] = Math.round(clamp((dy * edgeFactor) / range * 0.5 + 0.5, 0, 1) * 255);
      // The filter reads only R/G; keep B neutral to avoid implying a third vector channel.
      data[pixel + 2] = 0;
      data[pixel + 3] = 255;
    }
  }

  return { width, height, data, scale: range * 2 };
}

function getCrcTable() {
  if (crcTable) return crcTable;
  crcTable = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    crcTable[index] = value >>> 0;
  }
  return crcTable;
}

function crc32(buffer) {
  const table = getCrcTable();
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data = Buffer.alloc(0)) {
  const typeBuffer = Buffer.from(type, "ascii");
  const chunkData = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(chunkData.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, chunkData])), 0);
  return Buffer.concat([length, typeBuffer, chunkData, crc]);
}

export function createLiquidGlassDisplacementPng(options = {}) {
  const map = createLiquidGlassDisplacementPixels(options);
  const rawStride = map.width * 4;
  const raw = Buffer.alloc((rawStride + 1) * map.height);

  for (let y = 0; y < map.height; y += 1) {
    const rawOffset = y * (rawStride + 1);
    const dataOffset = y * rawStride;
    raw[rawOffset] = 0;
    raw.set(map.data.subarray(dataOffset, dataOffset + rawStride), rawOffset + 1);
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(map.width, 0);
  header.writeUInt32BE(map.height, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  const png = Buffer.concat([
    PNG_SIGNATURE,
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(raw, { level: 9 })),
    pngChunk("IEND")
  ]);
  png.liquidGlassScale = map.scale;
  return png;
}

export function createLiquidGlassDisplacementDataUri(options = {}) {
  const png = createLiquidGlassDisplacementPng(options);
  return {
    url: `data:image/png;base64,${png.toString("base64")}`,
    scale: png.liquidGlassScale
  };
}

export function createLiquidGlassDisplacementMap(options = {}) {
  return createLiquidGlassDisplacementDataUri(options);
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
}

function printHelp() {
  console.log([
    "Usage:",
    "  node scripts/generate-displacement-map.mjs --width 420 --height 96 --radius 48",
    "  node scripts/generate-displacement-map.mjs --width 420 --height 96 --radius 48 --mode png --output map.png",
    "",
    "Options:",
    "  --width <px>            Map width. Default: 400",
    "  --height <px>           Map height. Default: 96",
    "  --radius <px>           Corner radius. Default: half of short side",
    "  --profile <name>        Lens falloff: standard, soft, prominent, thin. Default: standard",
    "  --magnify <0.2-2>       Lens curvature. Default: 1",
    "  --bend <0-0.3>          Organic optical bend. Default: 0.06",
    "  --spread <0.4-1>        Encoding overshoot; lower = crisper rim. Default: 0.58",
    "  --bezel-ratio <0.2-1>   Bezel band as share of half the short side. Default: 0.62",
    "  --mode <data-uri|png>   Output format. Default: data-uri",
    "  --output <file>         Write output to a file instead of stdout",
    "",
    "The command prints the measured feDisplacementMap scale on stderr.",
    "Apply that value (times your strength multiplier) — never guess it."
  ].join("\n"));
}

function optionsFromArgs(args) {
  return {
    width: args.width,
    height: args.height,
    radius: args.radius,
    profile: args.profile,
    magnify: args.magnify,
    bend: args.bend,
    spread: args.spread,
    bezelRatio: args["bezel-ratio"]
  };
}

function runCli() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h) {
    printHelp();
    return;
  }

  const options = optionsFromArgs(args);
  const mode = String(args.mode || "data-uri").toLowerCase();

  if (mode === "png") {
    const png = createLiquidGlassDisplacementPng(options);
    if (args.output) {
      writeFileSync(String(args.output), png);
    } else {
      process.stdout.write(png);
    }
    console.error(`feDisplacementMap scale: ${png.liquidGlassScale.toFixed(2)}`);
    return;
  }

  const { url, scale } = createLiquidGlassDisplacementDataUri(options);
  if (args.output) {
    writeFileSync(String(args.output), url);
  } else {
    console.log(url);
  }
  console.error(`feDisplacementMap scale: ${scale.toFixed(2)}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli();
}
