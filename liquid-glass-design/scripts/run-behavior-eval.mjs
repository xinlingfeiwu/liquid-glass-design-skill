#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const defaultOutDir = resolve(repoRoot, "artifacts/behavior-eval");
const defaultPromptPath = resolve(repoRoot, "liquid-glass-design/references/prompt-patterns.md");

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

function commandExists(command) {
  const result = spawnSync("sh", ["-lc", `command -v ${JSON.stringify(command)} >/dev/null 2>&1`], { encoding: "utf8" });
  return result.status === 0;
}

function stripMarkdownFences(text) {
  const trimmed = String(text || "").trim();
  const match = /^```(?:html)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);
  return match ? match[1].trim() : trimmed;
}

async function waitForServer(url) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Keep waiting.
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const required = Boolean(args.required);
  const shouldRun = process.env.RUN_BEHAVIOR_EVAL === "1" || required;
  const command = String(args.command || process.env.BEHAVIOR_EVAL_COMMAND || "claude");
  const outDir = resolve(repoRoot, String(args["out-dir"] || defaultOutDir));
  const outFile = resolve(outDir, "index.html");

  if (!shouldRun) {
    console.log(JSON.stringify({
      status: "skipped",
      reason: "Set RUN_BEHAVIOR_EVAL=1 or pass --required to run agent-generation behavior eval."
    }, null, 2));
    return;
  }

  if (!commandExists(command)) {
    const message = `Behavior eval command not found: ${command}`;
    if (required) throw new Error(message);
    console.log(JSON.stringify({ status: "skipped", reason: message }, null, 2));
    return;
  }

  await mkdir(outDir, { recursive: true });
  const promptPatterns = await readFile(defaultPromptPath, "utf8");
  const prompt = `You are validating the liquid-glass-design skill by generating one self-contained HTML file.

Use this prompt pattern as the product request:

${promptPatterns}

Task:
- Return only a complete index.html document, no Markdown commentary.
- Build a premium Liquid Glass command surface demo with data-lg-role="stage", data-lg-role="focus", data-lg-role="dock", and data-lg-role="rail".
- Include CSS/SVG refraction using feDisplacementMap, adaptive Liquid Glass attributes or CSS variables, contrast-safe text, reduced-motion handling, and no background-attachment: fixed.
- Avoid external network assets.
`;

  const generation = spawnSync(command, ["-p", prompt], {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024
  });

  if (generation.status !== 0) {
    throw new Error(generation.stderr || generation.stdout || `${command} generation failed`);
  }

  const html = stripMarkdownFences(generation.stdout);
  await writeFile(outFile, html);

  const assertions = [
    ["feDisplacementMap", /feDisplacementMap/],
    ["data-lg-role stage", /data-lg-role=["']stage["']/],
    ["data-lg-role focus", /data-lg-role=["']focus["']/],
    ["data-lg-role dock", /data-lg-role=["']dock["']/],
    ["adaptive glass", /data-lg-adaptive|--lg-adaptive-|adaptive/i],
    ["reduced motion", /prefers-reduced-motion/]
  ];
  const failedAssertions = assertions
    .filter(([, pattern]) => !pattern.test(html))
    .map(([label]) => label);

  if (/background-attachment\s*:\s*fixed/i.test(html)) {
    failedAssertions.push("forbidden background-attachment: fixed");
  }

  if (failedAssertions.length) {
    throw new Error(`Behavior eval generated page failed static assertions: ${failedAssertions.join(", ")}`);
  }

  if (!args["skip-browser"] && existsSync(resolve(repoRoot, "liquid-glass-design/scripts/check-visual-geometry.mjs"))) {
    const port = Number(args.port || 4183);
    const server = spawn("python3", ["-m", "http.server", String(port), "--directory", outDir], {
      cwd: repoRoot,
      stdio: "ignore"
    });

    try {
      const url = `http://127.0.0.1:${port}/`;
      await waitForServer(url);
      const qa = spawnSync(process.execPath, [
        "liquid-glass-design/scripts/check-visual-geometry.mjs",
        "--url",
        url,
        "--browser",
        "chromium",
        "--viewport",
        "1440x900",
        "--expect-svg-filter",
        "auto",
        "--adaptive",
        "--contrast",
        "--min-contrast",
        "4.5",
        "--wait-ms",
        "500"
      ], {
        cwd: repoRoot,
        encoding: "utf8",
        maxBuffer: 10 * 1024 * 1024
      });
      if (qa.status !== 0) {
        throw new Error(qa.stderr || qa.stdout || "Behavior eval visual QA failed");
      }
    } finally {
      server.kill("SIGTERM");
    }
  }

  console.log(JSON.stringify({
    status: "passed",
    output: outFile
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
