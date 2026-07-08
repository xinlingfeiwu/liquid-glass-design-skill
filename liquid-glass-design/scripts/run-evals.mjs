#!/usr/bin/env node

import { readdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const skillDir = resolve(scriptDir, "..");
const evalPath = join(skillDir, "evals", "evals.json");
const baselinePath = join(skillDir, "evals", "baseline.json");

function parseArgs(argv) {
  return Object.fromEntries(argv.map((arg) => [arg.replace(/^--/, ""), true]));
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", "dist", ".git", ".vite", "coverage"].includes(entry.name)) continue;
      files.push(...await walk(full));
    } else if (entry.isFile()) {
      files.push(full);
    }
  }
  return files;
}

async function readFrontmatterDescription() {
  const skill = await readFile(join(skillDir, "SKILL.md"), "utf8");
  const match = /^---\n([\s\S]*?)\n---/.exec(skill);
  if (!match) return "";
  const description = /^description:\s*(.+)$/m.exec(match[1]);
  return description?.[1] || "";
}

function regexAny(patterns, text) {
  return patterns.some((pattern) => new RegExp(pattern, "i").test(text));
}

function regexGroups(groups, text) {
  return (groups || []).every((patterns) => regexAny(patterns, text));
}

async function readCombined(paths) {
  const chunks = [];
  for (const path of paths) {
    const full = join(skillDir, path);
    if (!existsSync(full)) continue;
    const files = (await import("node:fs")).statSync(full).isDirectory()
      ? await walk(full)
      : [full];
    for (const file of files) {
      if (/\.(png|jpg|jpeg|gif|ico|zip|skill)$/i.test(file)) continue;
      chunks.push(await readFile(file, "utf8"));
    }
  }
  return chunks.join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const evals = JSON.parse(await readFile(evalPath, "utf8"));
  const description = await readFrontmatterDescription();
  const triggerResults = [];
  const staticResults = [];

  for (const test of evals.trigger_cases || []) {
    const queryMatched = test.query_match_all
      ? regexGroups(test.query_match_all, test.query)
      : regexAny(test.match_any || [], test.query);
    const descriptionMatched = test.description_match_all
      ? regexGroups(test.description_match_all, description)
      : true;
    const excluded = regexAny(test.exclude_any || [], test.query);
    const actual = queryMatched && descriptionMatched && !excluded;
    triggerResults.push({
      id: test.id,
      expected: test.expected,
      actual,
      pass: actual === test.expected,
      queryMatched,
      descriptionMatched,
      excluded
    });
  }

  for (const assertion of evals.static_assertions || []) {
    const text = await readCombined(assertion.paths || ["."]);
    const includePass = assertion.must_include_any ? regexAny(assertion.must_include_any, text) : true;
    const forbidden = (assertion.must_not_include || []).filter((pattern) => new RegExp(pattern, "i").test(text));
    staticResults.push({ id: assertion.id, pass: includePass && forbidden.length === 0, includePass, forbidden });
  }

  const pluginEval = spawnSync("plugin-eval", ["--version"], { encoding: "utf8" });
  const stableReport = {
    schemaVersion: evals.schemaVersion || "2.0",
    triggerResults,
    staticResults
  };
  stableReport.passed = [...triggerResults, ...staticResults].filter((result) => result.pass).length;
  stableReport.total = triggerResults.length + staticResults.length;
  stableReport.failed = [...triggerResults, ...staticResults].filter((result) => !result.pass).map((result) => result.id);

  const report = {
    ...stableReport,
    environment: {
      pluginEvalAvailable: !pluginEval.error && pluginEval.status === 0
    }
  };

  if (args["write-baseline"]) {
    await writeFile(baselinePath, `${JSON.stringify(stableReport, null, 2)}\n`);
  }

  console.log(JSON.stringify(report, null, 2));
  if (stableReport.failed.length > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
