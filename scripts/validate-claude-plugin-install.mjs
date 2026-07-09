#!/usr/bin/env node

import { mkdtemp, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const command = process.env.CLAUDE_COMMAND || "npx";
const commandPrefix = command === "npx"
  ? ["--yes", "@anthropic-ai/claude-code"]
  : [];

function parseArgs(argv) {
  return {
    install: argv.includes("--install")
  };
}

function runClaude(args, options = {}) {
  const result = spawnSync(command, [...commandPrefix, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
    ...options
  });
  return result;
}

function failFromResult(label, result) {
  if (result.status === 0) return;
  throw new Error(`${label} failed:\n${result.stdout}\n${result.stderr}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const validatePlugin = runClaude(["plugin", "validate", "--strict", "."]);
  failFromResult("Claude plugin validate", validatePlugin);

  const validateMarketplace = runClaude(["plugin", "validate", "--strict", ".claude-plugin/marketplace.json"]);
  failFromResult("Claude marketplace validate", validateMarketplace);

  let install = null;
  if (args.install) {
    const tempHome = await mkdtemp(resolve(tmpdir(), "liquid-glass-claude-plugin-"));
    try {
      const env = { ...process.env, HOME: tempHome };
      const add = runClaude(["plugin", "marketplace", "add", repoRoot, "--scope", "user"], { env });
      failFromResult("Claude marketplace add", add);

      const installResult = runClaude(["plugin", "install", "liquid-glass-design@liquid-glass-design-skill"], { env });
      failFromResult("Claude plugin install", installResult);

      const list = runClaude(["plugin", "list"], { env });
      failFromResult("Claude plugin list", list);
      if (!/liquid-glass-design@liquid-glass-design-skill/.test(list.stdout)) {
        throw new Error(`Installed plugin was not listed:\n${list.stdout}\n${list.stderr}`);
      }
      install = {
        status: "passed",
        marketplace: "liquid-glass-design-skill",
        plugin: "liquid-glass-design@liquid-glass-design-skill"
      };
    } finally {
      await rm(tempHome, { recursive: true, force: true });
    }
  }

  console.log(JSON.stringify({
    status: "passed",
    command,
    strictValidation: true,
    install
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
