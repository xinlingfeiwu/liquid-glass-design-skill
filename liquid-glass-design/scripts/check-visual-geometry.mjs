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
  --browser chromium|webkit|firefox    Browser engine. Default: chromium
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
  --full-page                     Capture full-page screenshots. Default: viewport only
  --pixel-threshold 0.01          Max changed-pixel ratio allowed
  --pixel-channel-threshold 16    Per-pixel channel delta threshold
  --roi-roles dock,focus          Optional role crops for stricter pixel checks
  --roi-pixel-threshold 0.01      Max changed-pixel ratio inside role crops
  --expect-svg-filter enabled|disabled|auto
  --force-fallback                Force template fallback path before page scripts run
  --reduced-motion                Emulate prefers-reduced-motion: reduce
  --contrast                      Estimate text/background contrast from screenshots
  --contrast-selector ".label"    Text selector for contrast checks
  --min-contrast 4.5              Minimum estimated contrast ratio
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

function parseCssColor(value) {
  const match = /rgba?\(([^)]+)\)/i.exec(String(value || ""));
  if (!match) return null;
  const parts = match[1].split(",").map((part) => Number.parseFloat(part.trim()));
  if (parts.length < 3 || parts.some((part, index) => index < 3 && !Number.isFinite(part))) return null;
  return { r: parts[0], g: parts[1], b: parts[2], a: Number.isFinite(parts[3]) ? parts[3] : 1 };
}

function luminance({ r, g, b }) {
  const convert = (channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * convert(r) + 0.7152 * convert(g) + 0.0722 * convert(b);
}

function contrastRatio(a, b) {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const light = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return (light + 0.05) / (dark + 0.05);
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

function comparePngRegionBuffers(actualBuffer, baselineBuffer, channelThreshold, rect) {
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

  const left = Math.max(0, Math.floor(rect.left));
  const top = Math.max(0, Math.floor(rect.top));
  const right = Math.min(actual.width, Math.ceil(rect.right));
  const bottom = Math.min(actual.height, Math.ceil(rect.bottom));
  const pixels = Math.max(0, right - left) * Math.max(0, bottom - top);
  if (pixels === 0) {
    return { pass: true, reason: "outside-screenshot", changedRatio: 0, changedPixels: 0, pixels: 0 };
  }

  let changed = 0;
  for (let y = top; y < bottom; y += 1) {
    for (let x = left; x < right; x += 1) {
      const index = (y * actual.width + x) * 4;
      const delta =
        Math.abs(actual.rgba[index] - baseline.rgba[index]) +
        Math.abs(actual.rgba[index + 1] - baseline.rgba[index + 1]) +
        Math.abs(actual.rgba[index + 2] - baseline.rgba[index + 2]) +
        Math.abs(actual.rgba[index + 3] - baseline.rgba[index + 3]);
      if (delta > channelThreshold) changed += 1;
    }
  }

  return { pass: true, reason: "compared", changedRatio: changed / pixels, changedPixels: changed, pixels };
}

async function loadPlaywright() {
  const errors = [];
  try {
    return await import("playwright");
  } catch (error) {
    errors.push(error);
  }
  try {
    return await import("playwright-core");
  } catch (error) {
    errors.push(error);
  }
  console.error("Playwright is required for visual geometry checks.");
  console.error("Install it in the project that runs this script:");
  console.error("  npm i -D playwright && npx playwright install chromium");
  console.error("If your project already provides browsers, playwright-core is also accepted.");
  console.error(errors.map((error) => error.message).join("\n"));
  process.exit(2);
}

async function ensureDir(path) {
  if (path) await mkdir(path, { recursive: true });
}

function sampleAverage(png, points) {
  const pixels = [];
  for (const point of points) {
    const x = Math.max(0, Math.min(png.width - 1, Math.round(point.x)));
    const y = Math.max(0, Math.min(png.height - 1, Math.round(point.y)));
    const index = (y * png.width + x) * 4;
    pixels.push({ r: png.rgba[index], g: png.rgba[index + 1], b: png.rgba[index + 2], a: png.rgba[index + 3] / 255 });
  }
  if (!pixels.length) return null;
  return pixels.reduce((acc, pixel) => ({
    r: acc.r + pixel.r / pixels.length,
    g: acc.g + pixel.g / pixels.length,
    b: acc.b + pixel.b / pixels.length,
    a: acc.a + pixel.a / pixels.length
  }), { r: 0, g: 0, b: 0, a: 0 });
}

function estimateContrasts(screenshot, items, minContrast) {
  const png = decodePng(screenshot);
  return items.filter((item) => {
    const rect = item.rect;
    return rect.right >= 0 && rect.left <= png.width && rect.bottom >= 0 && rect.top <= png.height;
  }).map((item) => {
    const foreground = parseCssColor(item.color);
    const rect = item.rect;
    const inset = Math.min(8, Math.max(3, Math.min(rect.width, rect.height) * 0.18));
    const background = sampleAverage(png, [
      { x: rect.left - inset, y: rect.top + rect.height / 2 },
      { x: rect.right + inset, y: rect.top + rect.height / 2 },
      { x: rect.left + rect.width / 2, y: rect.top - inset },
      { x: rect.left + rect.width / 2, y: rect.bottom + inset },
      { x: rect.left + inset, y: rect.top + inset },
      { x: rect.right - inset, y: rect.bottom - inset }
    ]);
    const ratio = foreground && background ? contrastRatio(foreground, background) : 0;
    const minimum = Number.isFinite(item.minContrast) ? item.minContrast : minContrast;
    return {
      selector: item.selector,
      text: item.text,
      ratio: round(ratio),
      pass: ratio >= minimum,
      limit: minimum,
      foreground,
      background: background ? { r: round(background.r), g: round(background.g), b: round(background.b) } : null
    };
  });
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
  const browserName = String(args.browser || "chromium");
  const viewports = String(args.viewport || DEFAULT_VIEWPORTS).split(",").map(parseViewport);
  const minGap = Number(args["min-gap"] ?? 16);
  const maxCenterDelta = Number(args["max-center-delta"] ?? 1);
  const waitMs = Number(args["wait-ms"] ?? 300);
  const screenshotDir = args["screenshot-dir"] ? String(args["screenshot-dir"]) : "";
  const baselineDir = args["baseline-dir"] ? String(args["baseline-dir"]) : "";
  const updateBaseline = Boolean(args["update-baseline"]);
  const pixelThreshold = Number(args["pixel-threshold"] ?? 0.01);
  const pixelChannelThreshold = Number(args["pixel-channel-threshold"] ?? 16);
  const roiRoles = String(args["roi-roles"] || "").split(",").map((role) => role.trim()).filter(Boolean);
  const roiPixelThreshold = Number(args["roi-pixel-threshold"] ?? pixelThreshold);
  const expectSvgFilter = String(args["expect-svg-filter"] || "auto");
  const runContrast = Boolean(args.contrast);
  const fullPage = Boolean(args["full-page"]);
  const contrastSelector = String(args["contrast-selector"] || '[data-lg-contrast], .hero-copy h1, .hero-copy span, .lg-surface strong, .lg-surface .label, .lg-button span, .track-meta span');
  const minContrast = Number(args["min-contrast"] ?? 4.5);
  const reducedMotion = Boolean(args["reduced-motion"]);

  await ensureDir(screenshotDir);
  await ensureDir(baselineDir);

  const playwright = await loadPlaywright();
  const browserType = playwright[browserName];
  if (!browserType) {
    console.error(`Unknown Playwright browser "${browserName}". Use chromium, webkit, or firefox.`);
    process.exit(2);
  }
  let browser;
  try {
    browser = await browserType.launch();
  } catch (error) {
    console.error(`Could not launch Playwright ${browserName}.`);
    console.error("Install browser binaries with:");
    console.error(`  npx playwright install ${browserName}`);
    console.error(error.message);
    process.exit(2);
  }
  const results = [];
  const screenshots = [];
  const diffs = [];
  const contrasts = [];

  try {
    for (const viewport of viewports) {
      const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1 });
      if (args["force-fallback"]) {
        await page.addInitScript(() => {
          window.__LG_FORCE_FALLBACK__ = true;
        });
      }
      if (reducedMotion) {
        await page.emulateMedia({ reducedMotion: "reduce" });
      }
      const pageErrors = [];
      const consoleErrors = [];
      page.on("pageerror", (error) => pageErrors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text());
      });
      await page.goto(String(args.url), { waitUntil: "networkidle", timeout: 30000 });
      if (waitMs > 0) await page.waitForTimeout(waitMs);

      const pageState = await page.evaluate((query) => {
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
        const surfaces = Array.from(document.querySelectorAll("[data-lg-refraction]"));
        return {
          rects: {
            stage: rect(query.stage),
            dock: rect(query.dock),
            focus: rect(query.focus),
            rail: rect(query.rail)
          },
          filter: {
            htmlHasSvgOk: document.documentElement.classList.contains("lg-svg-ok"),
            surfaceCount: surfaces.length,
            mapReadyCount: surfaces.filter((element) => element.classList.contains("lg-map-ready")).length,
            firstBackdropFilter: surfaces[0] ? (getComputedStyle(surfaces[0]).backdropFilter || getComputedStyle(surfaces[0]).webkitBackdropFilter || "") : ""
          },
          motion: {
            reducedMotionMatches: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
            transformTransitions: Array.from(document.querySelectorAll(".lg-button, [data-lg-interactive], liquid-glass[interactive]"))
              .map((element) => {
                const style = getComputedStyle(element);
                return {
                  selector: element.tagName.toLowerCase(),
                  transitionProperty: style.transitionProperty,
                  transitionDuration: style.transitionDuration
                };
              })
              .filter((item) => item.transitionProperty.split(",").map((part) => part.trim()).includes("transform"))
          }
        };
      }, selectors);
      const rects = pageState.rects;

      const contrastItems = runContrast ? await page.evaluate((selector) => {
        return Array.from(document.querySelectorAll(selector))
          .map((element) => {
            const box = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            return {
              selector,
              text: (element.textContent || "").trim().replace(/\s+/g, " ").slice(0, 80),
              color: style.color,
              minContrast: Number.parseFloat(element.getAttribute("data-lg-contrast-min") || ""),
              rect: {
                left: box.left,
                top: box.top,
                right: box.right,
                bottom: box.bottom,
                width: box.width,
                height: box.height
              }
            };
          })
          .filter((item) => item.text && item.rect.width > 2 && item.rect.height > 2);
      }, contrastSelector) : [];

      const screenshot = await page.screenshot({ fullPage });
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
          if (roiRoles.length) {
            const baseline = await readFile(baselinePath);
            roiRoles.forEach((role) => {
              const roleRect = rects[role];
              if (!roleRect) {
                diffs.push({ viewport: viewport.label, role, status: "missing-role", baselinePath, pass: false });
                return;
              }
              const roiComparison = comparePngRegionBuffers(screenshot, baseline, pixelChannelThreshold, roleRect);
              const roiPass = roiComparison.pass && roiComparison.changedRatio <= roiPixelThreshold;
              diffs.push({
                viewport: viewport.label,
                role,
                status: `roi-${roiComparison.reason}`,
                baselinePath,
                pass: roiPass,
                changedRatio: round(roiComparison.changedRatio),
                threshold: roiPixelThreshold,
                pixels: roiComparison.pixels
              });
            });
          }
        } else {
          diffs.push({ viewport: viewport.label, status: "missing-baseline", baselinePath, pass: false });
        }
      }

      const viewportContrasts = runContrast
        ? estimateContrasts(screenshot, contrastItems, minContrast).map((item) => ({ viewport: viewport.label, ...item }))
        : [];
      contrasts.push(...viewportContrasts);

      const dockCenterDelta = rects.stage && rects.dock
        ? Math.abs((rects.dock.left + rects.dock.width / 2) - (rects.stage.left + rects.stage.width / 2))
        : null;
      const focusDockGap = rects.focus && rects.dock ? rects.dock.top - rects.focus.bottom : null;
      const focusDockOverlap = overlapArea(rects.focus, rects.dock);
      const railFocusOverlap = overlapArea(rects.rail, rects.focus);
      const dockInsideStage = isInside(rects.stage, rects.dock);
      const focusInsideStage = isInside(rects.stage, rects.focus);

      const checks = [
        { name: "no-page-errors", pass: pageErrors.length === 0 && consoleErrors.length === 0, value: { pageErrors, consoleErrors }, limit: "none" },
        { name: "surfaces-present", pass: pageState.filter.surfaceCount > 0, value: pageState.filter.surfaceCount, limit: ">0" },
        { name: "dock-centered", pass: dockCenterDelta !== null && dockCenterDelta <= maxCenterDelta, value: round(dockCenterDelta), limit: maxCenterDelta },
        { name: "focus-dock-gap", pass: focusDockGap !== null && focusDockGap >= minGap, value: round(focusDockGap), limit: minGap },
        { name: "focus-dock-overlap", pass: focusDockOverlap === 0, value: round(focusDockOverlap), limit: 0 },
        { name: "rail-focus-overlap", pass: railFocusOverlap === 0, value: round(railFocusOverlap), limit: 0 },
        { name: "dock-inside-stage", pass: dockInsideStage, value: dockInsideStage, limit: true },
        { name: "focus-inside-stage", pass: focusInsideStage, value: focusInsideStage, limit: true }
      ];
      if (expectSvgFilter === "enabled") {
        checks.push(
          { name: "svg-filter-enabled", pass: pageState.filter.htmlHasSvgOk, value: pageState.filter.htmlHasSvgOk, limit: true },
          { name: "maps-ready", pass: pageState.filter.mapReadyCount === pageState.filter.surfaceCount, value: pageState.filter.mapReadyCount, limit: pageState.filter.surfaceCount }
        );
      } else if (expectSvgFilter === "disabled") {
        checks.push({ name: "svg-filter-disabled", pass: !pageState.filter.htmlHasSvgOk, value: pageState.filter.htmlHasSvgOk, limit: false });
      }
      if (reducedMotion) {
        checks.push(
          { name: "reduced-motion-media", pass: pageState.motion.reducedMotionMatches, value: pageState.motion.reducedMotionMatches, limit: true },
          { name: "no-transform-transitions", pass: pageState.motion.transformTransitions.length === 0, value: pageState.motion.transformTransitions, limit: [] }
        );
      }

      results.push({ viewport: viewport.label, browser: browserName, selectors, rects, filter: pageState.filter, motion: pageState.motion, checks });
      await page.close();
    }
  } finally {
    await browser.close();
  }

  const failed = [
    ...results.flatMap((result) => result.checks.filter((check) => !check.pass).map((check) => ({ type: "geometry", viewport: result.viewport, ...check }))),
    ...diffs.filter((diff) => !diff.pass).map((diff) => ({ type: "pixel", ...diff })),
    ...contrasts.filter((contrast) => !contrast.pass).map((contrast) => ({ type: "contrast", ...contrast }))
  ];

  console.log(JSON.stringify({ url: args.url, browser: browserName, results, failed, screenshots, diffs, contrasts }, null, 2));
  if (failed.length > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
