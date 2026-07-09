#!/usr/bin/env node

import { lstat, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const skillPath = resolve(repoRoot, "skills/liquid-glass-design");

function fail(message) {
  throw new Error(message);
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function requireString(object, path) {
  const value = path.split(".").reduce((current, part) => current?.[part], object);
  if (typeof value !== "string" || !value.trim()) {
    fail(`Missing required string field: ${path}`);
  }
  return value;
}

async function assertNoSymlink(path, label) {
  const info = await lstat(path);
  if (info.isSymbolicLink()) {
    fail(`${label} must be a real directory or file, not a symlink: ${path}`);
  }
  return info;
}

function assertInsideRepo(relativePath, label) {
  if (typeof relativePath !== "string" || !relativePath.startsWith("./")) {
    fail(`${label} must be a relative ./ path`);
  }
  const resolved = resolve(repoRoot, relativePath);
  if (resolved !== repoRoot && !resolved.startsWith(`${repoRoot}/`)) {
    fail(`${label} must not escape the plugin root: ${relativePath}`);
  }
  if (!existsSync(resolved)) {
    fail(`${label} path does not exist: ${relativePath}`);
  }
  return resolved;
}

function skillPaths(value, label) {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value;
  fail(`${label} must be a string or array of strings`);
}

async function validateManifest(manifestPath, { claude = false } = {}) {
  if (!existsSync(manifestPath)) fail(`Missing plugin manifest: ${manifestPath}`);
  const manifest = await readJson(manifestPath);

  requireString(manifest, "name");
  requireString(manifest, "version");
  requireString(manifest, "description");
  requireString(manifest, "license");

  if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(manifest.version)) {
    fail(`${manifestPath} version must be semver-like`);
  }
  if ("hooks" in manifest) {
    fail(`${manifestPath} must not declare unsupported hooks`);
  }

  const paths = skillPaths(manifest.skills, `${manifestPath} skills`);
  for (const entry of paths) {
    const resolved = assertInsideRepo(entry, `${manifestPath} skills`);
    await assertNoSymlink(resolved, `${manifestPath} skills target`);
  }

  if (claude && existsSync(resolve(repoRoot, ".claude-plugin/manifest.json"))) {
    fail("Use .claude-plugin/plugin.json; .claude-plugin/manifest.json is intentionally not supported");
  }

  if (manifest.interface) {
    requireString(manifest.interface, "displayName");
    requireString(manifest.interface, "shortDescription");
    requireString(manifest.interface, "developerName");
    requireString(manifest.interface, "category");
  }
}

async function main() {
  await assertNoSymlink(resolve(repoRoot, "skills"), "skills root");
  await assertNoSymlink(skillPath, "Liquid Glass skill directory");
  if (!existsSync(resolve(skillPath, "SKILL.md"))) {
    fail("skills/liquid-glass-design/SKILL.md is missing");
  }

  await validateManifest(resolve(repoRoot, ".codex-plugin/plugin.json"));
  await validateManifest(resolve(repoRoot, ".claude-plugin/plugin.json"), { claude: true });

  console.log(JSON.stringify({
    status: "passed",
    skillPath: "skills/liquid-glass-design",
    manifests: [
      ".codex-plugin/plugin.json",
      ".claude-plugin/plugin.json"
    ]
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
