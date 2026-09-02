#!/usr/bin/env node
/**
 * wire-topics — put every topic simulation into the registry.
 *
 * Topic files are written by many hands at once, and hand-editing one shared
 * registry from all of them is exactly how two agents once produced a file
 * that compiled for neither. So nobody edits it: each topic file declares its
 * own exports, and this regenerates the wiring from what is actually on disk.
 *
 * It rewrites two regions of `src/sims/registry.ts` and touches nothing else:
 * the block of imports from `./topics/`, and the topic entries in `SIMS`.
 *
 *   node scripts/wire-topics.mjs [--check]
 *
 * `--check` exits non-zero if the file would change, for use in CI.
 */

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const APP = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TOPICS = resolve(APP, "src/sims/topics");
const REGISTRY = resolve(APP, "src/sims/registry.ts");

/** An export name that belongs to a topic file, e.g. `g7b2MassIsKept`. */
const TOPIC_EXPORT = /^g[1-9]\d?[a-f]\d[A-Z]/;

const files = readdirSync(TOPICS)
  .filter((f) => f.endsWith(".ts") && !f.startsWith("_"))
  .sort();

const perFile = [];
for (const f of files) {
  const src = readFileSync(resolve(TOPICS, f), "utf8");
  const names = [...src.matchAll(/^export const (\w+)\s*=\s*buildSim\(/gm)].map((m) => m[1]);
  if (!names.length) continue;
  const bad = names.filter((n) => !TOPIC_EXPORT.test(n));
  if (bad.length) {
    console.error(`wire-topics: ${f} exports ${bad.join(", ")} — not a topic name (gNxNPascal)`);
    process.exitCode = 2;
  }
  perFile.push({ module: f.replace(/\.ts$/, ""), names });
}

/** Wrap a list of names into import lines that stay under a sensible width. */
function importBlock(module, names) {
  const lines = [];
  let cur = "";
  for (const n of names) {
    const next = cur ? `${cur} ${n},` : `  ${n},`;
    if (next.length > 96 && cur) { lines.push(cur); cur = `  ${n},`; }
    else cur = next;
  }
  if (cur) lines.push(cur);
  return [`import {`, ...lines, `} from "./topics/${module}";`].join("\n");
}

let src = readFileSync(REGISTRY, "utf8");

// 1. The import region: every `import { ... } from "./topics/x";`, replaced in
//    place at the position of the first one.
const importRe = /import \{[^}]*\} from "\.\/topics\/[^"]+";\n/g;
const found = [...src.matchAll(importRe)];
const generated = perFile.map((p) => importBlock(p.module, p.names)).join("\n") + "\n";
if (found.length) {
  const first = found[0].index;
  src = src.slice(0, first) + src.slice(first).replace(importRe, "");
  src = src.slice(0, first) + generated + src.slice(first);
} else {
  // First run: put them directly after the last existing import.
  const lastImport = src.lastIndexOf("\nimport ");
  const eol = src.indexOf("\n", src.indexOf(";", lastImport)) + 1;
  src = src.slice(0, eol) + generated + src.slice(eol);
}

// 2. The SIMS entries: drop every existing topic name, then insert the full
//    list at the head of the array so the catalogue reads in curriculum order.
const openTag = "export const SIMS: AnySim[] = [";
const open = src.indexOf(openTag);
if (open < 0) throw new Error("wire-topics: cannot find the SIMS array");
const bodyStart = open + openTag.length;
const close = src.indexOf("\n];", bodyStart);
if (close < 0) throw new Error("wire-topics: cannot find the end of the SIMS array");

const kept = src.slice(bodyStart, close)
  .split("\n")
  .filter((line) => {
    const name = line.trim().replace(/,$/, "");
    return !TOPIC_EXPORT.test(name);
  })
  .join("\n")
  .replace(/^\n+/, "\n");

const entries = perFile.flatMap((p) => p.names).map((n) => `  ${n},`).join("\n");
src = src.slice(0, bodyStart) + "\n" + entries + kept + src.slice(close);

const before = readFileSync(REGISTRY, "utf8");
if (process.argv.includes("--check")) {
  if (before !== src) {
    console.error("wire-topics: registry.ts is out of date — run `node scripts/wire-topics.mjs`");
    process.exit(1);
  }
  console.log(`wire-topics: up to date (${perFile.length} files, ${perFile.reduce((a, p) => a + p.names.length, 0)} sims)`);
} else {
  writeFileSync(REGISTRY, src);
  console.log(`wire-topics: ${perFile.length} topic files, ${perFile.reduce((a, p) => a + p.names.length, 0)} simulations wired`);
}
