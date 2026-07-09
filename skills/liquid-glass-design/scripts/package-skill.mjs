#!/usr/bin/env node

import { copyFile, mkdir, readdir, rm, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const skillDir = resolve(scriptDir, "..");
const skillParentDir = dirname(skillDir);
const repoRoot = resolve(skillDir, "../..");
const outputDir = resolve(repoRoot, "dist");
const EXCLUDE_PARTS = new Set([".git", "node_modules", "dist", ".vite", "coverage", "__pycache__"]);
const EXCLUDE_SUFFIXES = [".log", ".DS_Store"];
const EXCLUDE_PREFIXES = ["liquid-glass-design/evals/baselines/"];
const LEAN_EXCLUDE_PATHS = new Set([
  "liquid-glass-design/agents/openai.yaml",
  "liquid-glass-design/references/github-research.md",
  "liquid-glass-design/scripts/run-evals.mjs",
  "liquid-glass-design/scripts/test-displacement-map.mjs",
  "liquid-glass-design/assets/templates/react-liquid-glass/package-lock.json"
]);
const LEAN_EXCLUDE_PARTS = new Set(["evals"]);

function parseArgs(argv) {
  return Object.fromEntries(argv.map((arg) => [arg.replace(/^--/, ""), true]));
}

function outputPaths(lean) {
  const stem = lean ? "liquid-glass-design.lean.skill" : "liquid-glass-design.skill";
  return {
    zipPath: join(outputDir, `${stem}.zip`),
    skillPath: join(outputDir, stem)
  };
}

function isExcluded(path, { lean = false } = {}) {
  const parts = path.split("/");
  const baseExcluded =
    parts.some((part) => EXCLUDE_PARTS.has(part)) ||
    EXCLUDE_SUFFIXES.some((suffix) => path.endsWith(suffix)) ||
    EXCLUDE_PREFIXES.some((prefix) => path.startsWith(prefix));
  if (baseExcluded) return true;
  if (!lean) return false;
  return LEAN_EXCLUDE_PATHS.has(path) || parts.some((part) => LEAN_EXCLUDE_PARTS.has(part));
}

async function walk(dir, options) {
  const entries = await readdir(dir);
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const rel = relative(skillParentDir, fullPath).replaceAll("\\", "/");
    if (isExcluded(rel, options)) continue;
    const info = await stat(fullPath);
    if (info.isDirectory()) {
      files.push(...await walk(fullPath, options));
    } else if (info.isFile()) {
      files.push({ path: rel, size: info.size });
    }
  }
  return files;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const lean = Boolean(args.lean);
  const { zipPath, skillPath } = outputPaths(lean);
  const files = await walk(skillDir, { lean });
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);

  if (args["dry-run"]) {
    console.log(JSON.stringify({
      mode: "dry-run",
      profile: lean ? "lean" : "full",
      files: files.length,
      totalBytes,
      outputs: [relative(repoRoot, zipPath), relative(repoRoot, skillPath)],
      excluded: Array.from(EXCLUDE_PARTS).sort(),
      excludedPathPrefixes: EXCLUDE_PREFIXES,
      leanExcluded: lean ? {
        paths: Array.from(LEAN_EXCLUDE_PATHS).sort(),
        parts: Array.from(LEAN_EXCLUDE_PARTS).sort()
      } : null
    }, null, 2));
    return;
  }

  const zipCheck = spawnSync("zip", ["-v"], { encoding: "utf8" });
  if (zipCheck.error) {
    console.error("The package script requires the system `zip` command.");
    console.error("macOS: zip is built in. Ubuntu CI: sudo apt-get install zip.");
    process.exit(2);
  }

  await mkdir(outputDir, { recursive: true });
  await rm(zipPath, { force: true });
  await rm(skillPath, { force: true });
  const zip = spawnSync("zip", ["-q", "-X", "-@", zipPath], {
    cwd: skillParentDir,
    input: `${files.map((file) => file.path).join("\n")}\n`,
    encoding: "utf8"
  });
  if (zip.status !== 0) {
    console.error(zip.stderr || zip.stdout || "zip failed");
    process.exit(zip.status || 1);
  }
  await copyFile(zipPath, skillPath);
  console.log(JSON.stringify({
    mode: "package",
    profile: lean ? "lean" : "full",
    files: files.length,
    totalBytes,
    outputs: [relative(repoRoot, zipPath), relative(repoRoot, skillPath)]
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
