#!/usr/bin/env node

const DEFAULT_VIEWPORTS = "2048x1114,1440x900,390x844";

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
  --stage ".visual-stage"          Stage/root selector
  --dock ".transport-bar"          Global dock/command bar selector
  --focus ".media-card"            Focal content selector
  --rail ".insight-rail"           Secondary rail selector
  --viewport "2048x1114,390x844"   Comma-separated viewport list
  --min-gap 16                     Minimum clear gap between focus and dock
  --max-center-delta 1             Max px delta for centered dock
  --screenshot-dir ./shots         Optional screenshot output directory
  --wait-ms 300                    Extra settle wait after network idle`;
}

function parseViewport(value) {
  const match = /^(\d+)x(\d+)$/.exec(String(value).trim());
  if (!match) throw new Error(`Invalid viewport "${value}". Use WIDTHxHEIGHT.`);
  return { width: Number(match[1]), height: Number(match[2]), label: `${match[1]}x${match[2]}` };
}

function round(value) {
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : value;
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

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch (error) {
    console.error("Playwright is required for visual geometry checks.");
    console.error("Install it in the project that runs this script: npm i -D playwright");
    console.error(error.message);
    process.exit(2);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.url) {
    console.log(usage());
    process.exit(args.help ? 0 : 1);
  }

  const selectors = {
    stage: args.stage || ".visual-stage",
    dock: args.dock || ".transport-bar",
    focus: args.focus || ".media-card",
    rail: args.rail || ".insight-rail"
  };
  const viewports = String(args.viewport || DEFAULT_VIEWPORTS).split(",").map(parseViewport);
  const minGap = Number(args["min-gap"] ?? 16);
  const maxCenterDelta = Number(args["max-center-delta"] ?? 1);
  const waitMs = Number(args["wait-ms"] ?? 300);
  const screenshotDir = args["screenshot-dir"] ? String(args["screenshot-dir"]) : "";
  if (screenshotDir) {
    const fs = await import("node:fs/promises");
    await fs.mkdir(screenshotDir, { recursive: true });
  }

  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch();
  const results = [];

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

      if (screenshotDir) {
        await page.screenshot({ path: `${screenshotDir.replace(/\/$/, "")}/liquid-glass-${viewport.label}.png`, fullPage: true });
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

  const failed = results.flatMap((result) => result.checks.filter((check) => !check.pass).map((check) => ({ viewport: result.viewport, ...check })));
  console.log(JSON.stringify({ url: args.url, results, failed }, null, 2));
  if (failed.length > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
