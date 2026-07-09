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

function requireArray(object, path) {
  const value = path.split(".").reduce((current, part) => current?.[part], object);
  if (!Array.isArray(value)) {
    fail(`Missing required array field: ${path}`);
  }
  return value;
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

async function validateClaudeMarketplace(marketplacePath) {
  if (!existsSync(marketplacePath)) fail(`Missing Claude marketplace manifest: ${marketplacePath}`);
  const marketplace = await readJson(marketplacePath);

  requireString(marketplace, "name");
  requireString(marketplace, "description");
  const plugins = requireArray(marketplace, "plugins");
  if (marketplace.name !== "liquid-glass-design-skill") {
    fail(".claude-plugin/marketplace.json name must be liquid-glass-design-skill");
  }

  const liquidGlass = plugins.find((plugin) => plugin?.name === "liquid-glass-design");
  if (!liquidGlass) {
    fail(".claude-plugin/marketplace.json must list liquid-glass-design");
  }

  const source = requireString(liquidGlass, "source");
  const sourcePath = assertInsideRepo(source, ".claude-plugin/marketplace.json plugins[0].source");
  await assertNoSymlink(sourcePath, ".claude-plugin/marketplace.json plugin source");
  if (!existsSync(resolve(sourcePath, ".claude-plugin/plugin.json"))) {
    fail(".claude-plugin/marketplace.json source must point at a plugin root");
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
  await validateClaudeMarketplace(resolve(repoRoot, ".claude-plugin/marketplace.json"));

  console.log(JSON.stringify({
    status: "passed",
    skillPath: "skills/liquid-glass-design",
    manifests: [
      ".codex-plugin/plugin.json",
      ".claude-plugin/plugin.json",
      ".claude-plugin/marketplace.json"
    ]
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
