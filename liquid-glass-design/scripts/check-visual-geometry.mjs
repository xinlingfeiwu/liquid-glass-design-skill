#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { inflateSync } from "node:zlib";

const DEFAULT_VIEWPORTS = "2048x1114,1440x900,390x844";
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      index += 1;
    }
  }
  return args;
}

function usage() {
  return `Usage:
node scripts/check-visual-geometry.mjs --url http://127.0.0.1:4173 [options]

Options:
  --stage ".app"                  Stage/root selector. Default: [data-lg-role="stage"], .visual-stage
  --dock ".dock"                  Dock selector. Default: [data-lg-role="dock"], .transport-bar
  --focus ".card"                 Focal selector. Default: [data-lg-role="focus"], .media-card
  --rail ".rail"                  Rail selector. Default: [data-lg-role="rail"], .insight-rail
  --viewport "2048x1114,390x844"  Comma-separated viewport list
  --min-gap 16                    Minimum clear gap between focus and dock
  --max-center-delta 1            Max px delta for centered dock
  --screenshot-dir ./shots        Optional screenshot output directory
  --baseline-dir ./baselines      Optional PNG baseline directory
  --update-baseline               Write/update baseline PNGs instead of comparing
  --pixel-threshold 0.01          Max changed-pixel ratio allowed
  --pixel-channel-threshold 16    Per-pixel channel delta threshold
  --wait-ms 300                   Extra settle wait after network idle`;
}

function parseViewport(value) {
  const match = /^(\d+)x(\d+)$/.exec(String(value).trim());
  if (!match) throw new Error(`Invalid viewport "${value}". Use WIDTHxHEIGHT.`);
  return { width: Number(match[1]), height: Number(match[2]), label: `${match[1]}x${match[2]}` };
}

function round(value) {
  return Number.isFinite(value) ? Math.round(value * 10000) / 10000 : value;
}

function overlapArea(a, b) {
  if (!a || !b) return 0;
  const x = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const y = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  return x * y;
}

function isInside(container, child, tolerance = 1) {
  if (!container || !child) return false;
  return (
    child.left >= container.left - tolerance &&
    child.top >= container.top - tolerance &&
    child.right <= container.right + tolerance &&
    child.bottom <= container.bottom + tolerance
  );
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function decodePng(buffer) {
  if (!buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error("Invalid PNG signature.");
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString("ascii");
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    offset += 12 + length;

    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") {
      break;
    }
  }

  if (bitDepth !== 8 || ![2, 6].includes(colorType)) {
    throw new Error(`Unsupported PNG format: bitDepth=${bitDepth}, colorType=${colorType}. Expected 8-bit RGB/RGBA.`);
  }

  const channels = colorType === 6 ? 4 : 3;
  const stride = width * channels;
  const inflated = inflateSync(Buffer.concat(idat));
  const rgba = new Uint8Array(width * height * 4);
  let input = 0;
  let output = 0;
  let prev = new Uint8Array(stride);

  for (let y = 0; y < height; y += 1) {
    const filter = inflated[input];
    input += 1;
    const row = new Uint8Array(stride);

    for (let x = 0; x < stride; x += 1) {
      const raw = inflated[input + x];
      const left = x >= channels ? row[x - channels] : 0;
      const up = prev[x] || 0;
      const upLeft = x >= channels ? prev[x - channels] || 0 : 0;
      if (filter === 0) row[x] = raw;
      else if (filter === 1) row[x] = (raw + left) & 0xff;
      else if (filter === 2) row[x] = (raw + up) & 0xff;
      else if (filter === 3) row[x] = (raw + Math.floor((left + up) / 2)) & 0xff;
      else if (filter === 4) row[x] = (raw + paeth(left, up, upLeft)) & 0xff;
      else throw new Error(`Unsupported PNG filter ${filter}.`);
    }

    input += stride;
    for (let x = 0; x < width; x += 1) {
      const source = x * channels;
      rgba[output] = row[source];
      rgba[output + 1] = row[source + 1];
      rgba[output + 2] = row[source + 2];
      rgba[output + 3] = channels === 4 ? row[source + 3] : 255;
      output += 4;
    }
    prev = row;
  }

  return { width, height, rgba };
}

function comparePngBuffers(actualBuffer, baselineBuffer, channelThreshold) {
  const actual = decodePng(actualBuffer);
  const baseline = decodePng(baselineBuffer);
  if (actual.width !== baseline.width || actual.height !== baseline.height) {
    return {
      pass: false,
      reason: "dimension-mismatch",
      actual: `${actual.width}x${actual.height}`,
      baseline: `${baseline.width}x${baseline.height}`,
      changedRatio: 1
    };
  }

  let changed = 0;
  const pixels = actual.width * actual.height;
  for (let index = 0; index < actual.rgba.length; index += 4) {
    const delta =
      Math.abs(actual.rgba[index] - baseline.rgba[index]) +
      Math.abs(actual.rgba[index + 1] - baseline.rgba[index + 1]) +
      Math.abs(actual.rgba[index + 2] - baseline.rgba[index + 2]) +
      Math.abs(actual.rgba[index + 3] - baseline.rgba[index + 3]);
    if (delta > channelThreshold) changed += 1;
  }

  return { pass: true, reason: "compared", changedRatio: changed / pixels, changedPixels: changed, pixels };
}

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch (error) {
    console.error("Playwright is required for visual geometry checks.");
    console.error("Install it in the project that runs this script:");
    console.error("  npm i -D playwright && npx playwright install chromium");
    console.error(error.message);
    process.exit(2);
  }
}

async function ensureDir(path) {
  if (path) await mkdir(path, { recursive: true });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.url) {
    console.log(usage());
    process.exit(args.help ? 0 : 1);
  }

  const selectors = {
    stage: args.stage || '[data-lg-role="stage"], .visual-stage',
    dock: args.dock || '[data-lg-role="dock"], .transport-bar',
    focus: args.focus || '[data-lg-role="focus"], .media-card',
    rail: args.rail || '[data-lg-role="rail"], .insight-rail'
  };
  const viewports = String(args.viewport || DEFAULT_VIEWPORTS).split(",").map(parseViewport);
  const minGap = Number(args["min-gap"] ?? 16);
  const maxCenterDelta = Number(args["max-center-delta"] ?? 1);
  const waitMs = Number(args["wait-ms"] ?? 300);
  const screenshotDir = args["screenshot-dir"] ? String(args["screenshot-dir"]) : "";
  const baselineDir = args["baseline-dir"] ? String(args["baseline-dir"]) : "";
  const updateBaseline = Boolean(args["update-baseline"]);
  const pixelThreshold = Number(args["pixel-threshold"] ?? 0.01);
  const pixelChannelThreshold = Number(args["pixel-channel-threshold"] ?? 16);

  await ensureDir(screenshotDir);
  await ensureDir(baselineDir);

  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch();
  const results = [];
  const screenshots = [];
  const diffs = [];

  try {
    for (const viewport of viewports) {
      const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1 });
      await page.goto(String(args.url), { waitUntil: "networkidle", timeout: 30000 });
      if (waitMs > 0) await page.waitForTimeout(waitMs);

      const rects = await page.evaluate((query) => {
        function rect(selector) {
          const element = document.querySelector(selector);
          if (!element) return null;
          const box = element.getBoundingClientRect();
          return {
            selector,
            left: box.left,
            top: box.top,
            right: box.right,
            bottom: box.bottom,
            width: box.width,
            height: box.height
          };
        }
        return {
          stage: rect(query.stage),
          dock: rect(query.dock),
          focus: rect(query.focus),
          rail: rect(query.rail)
        };
      }, selectors);

      const screenshot = await page.screenshot({ fullPage: true });
      const fileName = `liquid-glass-${viewport.label}.png`;
      if (screenshotDir) {
        const screenshotPath = `${screenshotDir.replace(/\/$/, "")}/${fileName}`;
        await writeFile(screenshotPath, screenshot);
        screenshots.push({ viewport: viewport.label, path: screenshotPath });
      }

      if (baselineDir) {
        const baselinePath = `${baselineDir.replace(/\/$/, "")}/${fileName}`;
        if (updateBaseline) {
          await writeFile(baselinePath, screenshot);
          diffs.push({ viewport: viewport.label, status: "updated", baselinePath, pass: true });
        } else if (existsSync(baselinePath)) {
          const comparison = comparePngBuffers(screenshot, await readFile(baselinePath), pixelChannelThreshold);
          const pass = comparison.pass && comparison.changedRatio <= pixelThreshold;
          diffs.push({ viewport: viewport.label, status: comparison.reason, baselinePath, pass, changedRatio: round(comparison.changedRatio), threshold: pixelThreshold });
        } else {
          diffs.push({ viewport: viewport.label, status: "missing-baseline", baselinePath, pass: false });
        }
      }

      const dockCenterDelta = rects.stage && rects.dock
        ? Math.abs((rects.dock.left + rects.dock.width / 2) - (rects.stage.left + rects.stage.width / 2))
        : null;
      const focusDockGap = rects.focus && rects.dock ? rects.dock.top - rects.focus.bottom : null;
      const focusDockOverlap = overlapArea(rects.focus, rects.dock);
      const railFocusOverlap = overlapArea(rects.rail, rects.focus);
      const dockInsideStage = isInside(rects.stage, rects.dock);
      const focusInsideStage = isInside(rects.stage, rects.focus);

      const checks = [
        { name: "dock-centered", pass: dockCenterDelta !== null && dockCenterDelta <= maxCenterDelta, value: round(dockCenterDelta), limit: maxCenterDelta },
        { name: "focus-dock-gap", pass: focusDockGap !== null && focusDockGap >= minGap, value: round(focusDockGap), limit: minGap },
        { name: "focus-dock-overlap", pass: focusDockOverlap === 0, value: round(focusDockOverlap), limit: 0 },
        { name: "rail-focus-overlap", pass: railFocusOverlap === 0, value: round(railFocusOverlap), limit: 0 },
        { name: "dock-inside-stage", pass: dockInsideStage, value: dockInsideStage, limit: true },
        { name: "focus-inside-stage", pass: focusInsideStage, value: focusInsideStage, limit: true }
      ];

      results.push({ viewport: viewport.label, selectors, rects, checks });
      await page.close();
    }
  } finally {
    await browser.close();
  }

  const failed = [
    ...results.flatMap((result) => result.checks.filter((check) => !check.pass).map((check) => ({ type: "geometry", viewport: result.viewport, ...check }))),
    ...diffs.filter((diff) => !diff.pass).map((diff) => ({ type: "pixel", ...diff }))
  ];

  console.log(JSON.stringify({ url: args.url, results, failed, screenshots, diffs }, null, 2));
  if (failed.length > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
