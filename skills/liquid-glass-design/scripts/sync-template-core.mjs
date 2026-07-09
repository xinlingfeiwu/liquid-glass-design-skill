#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const skillDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const rootDir = resolve(skillDir, "../..");
const sourcePath = resolve(skillDir, "assets/core/liquid-glass-core.js");
const targets = [
  "skills/liquid-glass-design/assets/templates/vanilla-liquid-glass/liquid-glass-core.js",
  "skills/liquid-glass-design/assets/templates/react-liquid-glass/src/liquid-glass-core.js",
  "skills/liquid-glass-design/assets/templates/web-component-liquid-glass/liquid-glass-core.js",
  "packages/liquid-glass-core/liquid-glass-core.js",
  "packages/react-liquid-glass/src/liquid-glass-core.js"
].map((path) => resolve(rootDir, path));

const header = `// GENERATED FROM skills/liquid-glass-design/assets/core/liquid-glass-core.js.
// Do not edit this generated copy directly; run \`npm run sync:templates\`.

`;

async function main() {
  const checkOnly = process.argv.includes("--check");
  const source = await readFile(sourcePath, "utf8");
  const generated = `${header}${source}`;
  const drifted = [];

  for (const target of targets) {
    let current = "";
    try {
      current = await readFile(target, "utf8");
    } catch {
      current = "";
    }

    if (current !== generated) {
      drifted.push(target);
      if (!checkOnly) {
        await mkdir(dirname(target), { recursive: true });
        await writeFile(target, generated);
      }
    }
  }

  if (drifted.length && checkOnly) {
    console.error("Template core copies are out of sync. Run `npm run sync:templates`.");
    drifted.forEach((target) => console.error(`- ${target}`));
    process.exit(1);
  }

  console.log(JSON.stringify({
    mode: checkOnly ? "check" : "write",
    source: sourcePath,
    targets: targets.length,
    changed: drifted.length
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
