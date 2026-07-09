#!/usr/bin/env node

import { cp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = resolve(repoRoot, "artifacts/pages");
const screenshotPath = resolve(repoRoot, "artifacts/screenshots/liquid-glass-1440x900.png");
const reactDist = resolve(repoRoot, "skills/liquid-glass-design/assets/templates/react-liquid-glass/dist");
const vanillaTemplate = resolve(repoRoot, "skills/liquid-glass-design/assets/templates/vanilla-liquid-glass");
const webComponentTemplate = resolve(repoRoot, "skills/liquid-glass-design/assets/templates/web-component-liquid-glass");

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function copyIfExists(source, target, label) {
  if (!(await exists(source))) {
    throw new Error(`Missing ${label}: ${source}`);
  }
  await cp(source, target, { recursive: true });
}

async function readOptional(path) {
  try {
    return await readFile(path, "utf8");
  } catch {
    return "";
  }
}

async function main() {
  await rm(outputDir, { recursive: true, force: true });
  await mkdir(resolve(outputDir, "preview"), { recursive: true });
  await mkdir(resolve(outputDir, "demo"), { recursive: true });

  await copyIfExists(screenshotPath, resolve(outputDir, "preview/preview-latest.png"), "visual QA screenshot");
  await copyIfExists(vanillaTemplate, resolve(outputDir, "demo/vanilla"), "vanilla demo");
  await copyIfExists(webComponentTemplate, resolve(outputDir, "demo/web-component"), "Web Component demo");
  await copyIfExists(reactDist, resolve(outputDir, "demo/react"), "React demo build");

  const readme = await readOptional(resolve(repoRoot, "README.md"));
  const title = /#\s+(.+)/.exec(readme)?.[1] || "Liquid Glass Design Skill";
  const index = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title}</title>
    <style>
      :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #060a12; color: #f8fbff; }
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 32px; background: radial-gradient(circle at 20% 18%, rgba(93, 213, 230, .24), transparent 34%), radial-gradient(circle at 82% 12%, rgba(160, 118, 255, .24), transparent 34%), #060a12; }
      main { width: min(960px, 100%); display: grid; gap: 24px; }
      img { width: 100%; border-radius: 28px; border: 1px solid rgba(255,255,255,.18); box-shadow: 0 28px 90px rgba(0,0,0,.45); }
      h1 { margin: 0; font-size: clamp(42px, 7vw, 84px); line-height: .92; letter-spacing: 0; }
      p { color: rgba(232, 244, 255, .72); font-size: 18px; line-height: 1.6; max-width: 720px; }
      nav { display: flex; flex-wrap: wrap; gap: 12px; }
      a { color: #f8fbff; text-decoration: none; border: 1px solid rgba(255,255,255,.22); background: rgba(255,255,255,.12); border-radius: 999px; padding: 12px 18px; box-shadow: inset 0 1px 0 rgba(255,255,255,.36), 0 12px 34px rgba(0,0,0,.28); }
      a:hover { background: rgba(255,255,255,.2); }
    </style>
  </head>
  <body>
    <main>
      <h1>Liquid Glass Design Skill</h1>
      <p>Live demos and the generated preview for the Liquid Glass skill package.</p>
      <nav>
        <a href="./demo/vanilla/">Vanilla Demo</a>
        <a href="./demo/react/">React Demo</a>
        <a href="./demo/web-component/">Web Component Demo</a>
        <a href="./preview/preview-latest.png">Preview PNG</a>
      </nav>
      <img src="./preview/preview-latest.png" alt="Liquid Glass visual preview">
    </main>
  </body>
</html>
`;
  await writeFile(resolve(outputDir, "index.html"), index);

  console.log(JSON.stringify({
    status: "prepared",
    outputDir: "artifacts/pages",
    paths: [
      "preview/preview-latest.png",
      "demo/vanilla/",
      "demo/react/",
      "demo/web-component/"
    ]
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
