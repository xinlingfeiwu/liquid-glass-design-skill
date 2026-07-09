#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const registry = "https://registry.npmjs.org/";
const packageDirs = [
  "packages/liquid-glass-core",
  "packages/react-liquid-glass"
];

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
    ...options
  });
  return result;
}

async function readPackage(packageDir) {
  const packagePath = resolve(packageDir, "package.json");
  return JSON.parse(await readFile(packagePath, "utf8"));
}

function isPublished(name, version) {
  const result = run("npm", ["view", `${name}@${version}`, "version", "--registry", registry]);
  if (result.status === 0) {
    return true;
  }
  const output = `${result.stdout}\n${result.stderr}`;
  if (/E404|404 Not Found|is not in this registry/i.test(output)) {
    return false;
  }
  throw new Error(`Unable to check ${name}@${version} on npm:\n${output}`);
}

function publish(packageDir) {
  const result = run("npm", [
    "publish",
    packageDir,
    "--registry",
    registry,
    "--access",
    "public",
    "--provenance"
  ], {
    env: {
      ...process.env,
      NPM_CONFIG_PROVENANCE: "true"
    }
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `npm publish failed for ${packageDir}`);
  }
  return result.stdout.trim();
}

async function main() {
  const results = [];
  for (const packageDir of packageDirs) {
    const pkg = await readPackage(packageDir);
    if (isPublished(pkg.name, pkg.version)) {
      results.push({ name: pkg.name, version: pkg.version, status: "skipped-existing" });
      continue;
    }
    const output = publish(packageDir);
    results.push({ name: pkg.name, version: pkg.version, status: "published", output });
  }

  console.log(JSON.stringify({
    status: "completed",
    registry,
    packages: results
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
