#!/usr/bin/env node

import { copyFile, mkdir, readdir, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const skillDir = resolve(scriptDir, "..");
const repoRoot = resolve(skillDir, "..");
const outputDir = resolve(repoRoot, "dist");
const zipPath = join(outputDir, "liquid-glass-design.skill.zip");
const skillPath = join(outputDir, "liquid-glass-design.skill");
const EXCLUDE_PARTS = new Set([".git", "node_modules", "dist", ".vite", "coverage", "__pycache__"]);
const EXCLUDE_SUFFIXES = [".log", ".DS_Store"];

function parseArgs(argv) {
  return Object.fromEntries(argv.map((arg) => [arg.replace(/^--/, ""), true]));
}

function isExcluded(path) {
  const parts = path.split("/");
  return parts.some((part) => EXCLUDE_PARTS.has(part)) || EXCLUDE_SUFFIXES.some((suffix) => path.endsWith(suffix));
}

async function walk(dir) {
  const entries = await readdir(dir);
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const rel = relative(repoRoot, fullPath).replaceAll("\\", "/");
    if (isExcluded(rel)) continue;
    const info = await stat(fullPath);
    if (info.isDirectory()) {
      files.push(...await walk(fullPath));
    } else if (info.isFile()) {
      files.push({ path: rel, size: info.size });
    }
  }
  return files;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const files = await walk(skillDir);
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);

  if (args["dry-run"]) {
    console.log(JSON.stringify({
      mode: "dry-run",
      files: files.length,
      totalBytes,
      outputs: [relative(repoRoot, zipPath), relative(repoRoot, skillPath)],
      excluded: Array.from(EXCLUDE_PARTS).sort()
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
  const zip = spawnSync("zip", ["-q", "-X", "-@", zipPath], {
    cwd: repoRoot,
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
    files: files.length,
    totalBytes,
    outputs: [relative(repoRoot, zipPath), relative(repoRoot, skillPath)]
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
