#!/usr/bin/env node

import { copyFile, mkdir, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const DEFAULT_TARGET = "docs/preview-latest.png";
const DEFAULT_SOURCES = [
  "artifacts/screenshots/liquid-glass-1440x900.png",
  "artifacts/screenshots/liquid-glass-2048x1114.png",
  "docs/preview-20260708-v4.png"
];

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

async function exists(path) {
  try {
    const info = await stat(path);
    return info.isFile();
  } catch {
    return false;
  }
}

async function firstAvailable(paths) {
  for (const path of paths) {
    const absolute = resolve(repoRoot, path);
    if (await exists(absolute)) return absolute;
  }
  return "";
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const target = resolve(repoRoot, String(args.target || DEFAULT_TARGET));
  const source = args.source
    ? resolve(repoRoot, String(args.source))
    : await firstAvailable(DEFAULT_SOURCES);

  if (!source || !(await exists(source))) {
    console.error("No preview source image found.");
    console.error(`Checked: ${args.source || DEFAULT_SOURCES.join(", ")}`);
    process.exit(2);
  }

  await mkdir(dirname(target), { recursive: true });
  await copyFile(source, target);
  console.log(JSON.stringify({
    source,
    target
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
