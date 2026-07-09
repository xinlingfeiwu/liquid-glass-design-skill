#!/usr/bin/env node

import { lstat, mkdir, readlink, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { basename, dirname, resolve } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const skillDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(skillDir, "../..");
const defaultOutDir = resolve(repoRoot, "artifacts/behavior-eval");
const skillName = basename(skillDir);

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

async function pathInfo(path) {
  try {
    return await lstat(path);
  } catch {
    return null;
  }
}

async function sameRealPath(left, right) {
  try {
    return await realpath(left) === await realpath(right);
  } catch {
    return false;
  }
}

async function installSkillForClaude(homeDir, { replace = false } = {}) {
  const skillsDir = resolve(homeDir, ".claude/skills");
  const target = resolve(skillsDir, skillName);
  await mkdir(skillsDir, { recursive: true });

  const current = await pathInfo(target);
  if (current) {
    if (current.isSymbolicLink()) {
      const linkTarget = resolve(dirname(target), await readlink(target));
      if (await sameRealPath(linkTarget, skillDir)) {
        return { target, action: "already-linked" };
      }
      if (replace) {
        await rm(target, { force: true });
      } else {
        throw new Error(`Refusing to replace existing Claude skill symlink: ${target} -> ${linkTarget}`);
      }
    } else if (await sameRealPath(target, skillDir)) {
      return { target, action: "already-present" };
    } else if (replace) {
      await rm(target, { recursive: true, force: true });
    } else {
      throw new Error(`Refusing to replace existing Claude skill path: ${target}`);
    }
  }

  await symlink(skillDir, target, "dir");
  return { target, action: "linked" };
}

function staticAssertions(html) {
  const assertions = [
    ["feDisplacementMap", /feDisplacementMap/],
    ["data-lg-role stage", /data-lg-role=["']stage["']/],
    ["data-lg-role focus", /data-lg-role=["']focus["']/],
    ["data-lg-role dock", /data-lg-role=["']dock["']/],
    ["adaptive glass", /data-lg-adaptive|--lg-adaptive-|adaptive/i],
    ["reduced motion", /prefers-reduced-motion/]
  ];
  const failed = assertions
    .filter(([, pattern]) => !pattern.test(html))
    .map(([label]) => label);

  if (/background-attachment\s*:\s*fixed/i.test(html)) {
    failed.push("forbidden background-attachment: fixed");
  }
  return failed;
}

async function runVisualQa(outDir, port) {
  const server = spawn("python3", ["-m", "http.server", String(port), "--directory", outDir], {
    cwd: repoRoot,
    stdio: "ignore"
  });

  try {
    const url = `http://127.0.0.1:${port}/`;
    await waitForServer(url);
    const qa = spawnSync(process.execPath, [
      "skills/liquid-glass-design/scripts/check-visual-geometry.mjs",
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
      return { pass: false, output: qa.stderr || qa.stdout || "Behavior eval visual QA failed" };
    }
    return { pass: true };
  } finally {
    server.kill("SIGTERM");
  }
}

async function runScenario({ label, command, prompt, homeDir, outDir, runBrowser, port, allowFailure = false }) {
  const scenarioDir = label === "with-skill" ? outDir : resolve(outDir, label);
  await mkdir(scenarioDir, { recursive: true });
  await mkdir(homeDir, { recursive: true });
  const outFile = resolve(scenarioDir, "index.html");
  const generation = spawnSync(command, ["-p", prompt], {
    cwd: repoRoot,
    env: { ...process.env, HOME: homeDir },
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024
  });

  if (generation.status !== 0) {
    const message = generation.stderr || generation.stdout || `${command} generation failed`;
    if (!allowFailure) throw new Error(message);
    return { label, status: "failed", phase: "generate", message };
  }

  const html = stripMarkdownFences(generation.stdout);
  await writeFile(outFile, html);

  const failedAssertions = staticAssertions(html);
  if (failedAssertions.length) {
    const message = `Static assertions failed: ${failedAssertions.join(", ")}`;
    if (!allowFailure) throw new Error(message);
    return { label, status: "failed", phase: "static", output: outFile, failedAssertions };
  }

  if (runBrowser) {
    const qa = await runVisualQa(scenarioDir, port);
    if (!qa.pass) {
      if (!allowFailure) throw new Error(qa.output);
      return { label, status: "failed", phase: "visual", output: outFile, message: qa.output };
    }
  }

  return { label, status: "passed", output: outFile };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const required = Boolean(args.required);
  const shouldRun = process.env.RUN_BEHAVIOR_EVAL === "1" || required;
  const command = String(args.command || process.env.BEHAVIOR_EVAL_COMMAND || "claude");
  const outDir = resolve(repoRoot, String(args["out-dir"] || defaultOutDir));
  const isolatedHome = resolve(outDir, "claude-home");
  const homeDir = args["real-claude-home"] ? homedir() : isolatedHome;
  const compareWithoutSkill = Boolean(args["compare-without-skill"] || process.env.BEHAVIOR_EVAL_AB === "1");
  const prompt = String(args.prompt || `Use the ${skillName} skill to build a premium glass command deck for a desktop productivity app. Return only a complete index.html document, no Markdown commentary. Avoid external network assets.`);

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
  const install = await installSkillForClaude(homeDir, { replace: Boolean(args["replace-skill"]) || !args["real-claude-home"] });
  const withSkill = await runScenario({
    label: "with-skill",
    command,
    prompt,
    homeDir,
    outDir,
    runBrowser: !args["skip-browser"],
    port: Number(args.port || 4183)
  });

  let withoutSkill = null;
  if (compareWithoutSkill) {
    const abHome = resolve(outDir, "claude-home-no-skill");
    withoutSkill = await runScenario({
      label: "without-skill",
      command,
      prompt,
      homeDir: abHome,
      outDir,
      runBrowser: !args["skip-browser"],
      port: Number(args["ab-port"] || 4184),
      allowFailure: true
    });
  }

  console.log(JSON.stringify({
    status: "passed",
    skillInstalled: install,
    prompt,
    result: withSkill,
    comparison: withoutSkill
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
