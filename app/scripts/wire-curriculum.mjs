#!/usr/bin/env node
/**
 * wire-curriculum — point every subtopic at its own simulation.
 *
 * The library was built before the catalogue was, so a subtopic listed
 * whichever existing simulation was closest, and one simulation ended up
 * standing in for six different lessons. That is the single loudest complaint
 * this project has had: a student who has already met a simulation in one
 * lesson learns nothing by meeting it again in the next.
 *
 * Topic files are written one simulation per subtopic, in subtopic order, so
 * the mapping is positional and can be derived rather than maintained. This
 * rewrites the `sims` field of every subtopic whose topic has a file with a
 * matching count, and reports every topic where the counts disagree instead of
 * guessing.
 *
 *   node scripts/wire-curriculum.mjs [--check]
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const APP = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TOPICS = resolve(APP, "src/sims/topics");

/** Read the simulation ids a topic file declares, in declaration order. */
function idsOf(grade, topicCode) {
  const file = resolve(TOPICS, `g${grade}${topicCode.toLowerCase()}.ts`);
  if (!existsSync(file)) return null;
  const src = readFileSync(file, "utf8");
  const consts = [...src.matchAll(/^export const (\w+)\s*=\s*buildSim\((\w+)\)/gm)];
  const ids = [];
  for (const [, , specName] of consts) {
    const m = src.match(new RegExp(`const ${specName}\\s*:\\s*ArchetypeSpec\\s*=\\s*\\{[\\s\\S]*?\\bid:\\s*"([^"]+)"`));
    if (m) ids.push(m[1]);
  }
  return ids.length ? ids : null;
}

/** The substring of `src` for the object literal starting at `open`. */
function objectAt(src, open) {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") { depth--; if (depth === 0) return [open, i + 1]; }
  }
  return null;
}

let changed = 0, skipped = [];

for (const grade of [6, 7, 8]) {
  const path = resolve(APP, `src/curriculum/grade${grade}.ts`);
  let src = readFileSync(path, "utf8");

  // Topic codes, in the order they appear.
  const topicCodes = [...src.matchAll(/code: "([A-F]\d)", title: "/g)].map((m) => m[1]);

  for (const topic of topicCodes) {
    const ids = idsOf(grade, topic);
    const subRe = new RegExp(`\\{\\s*code: "${topic}\\.\\d+"`, "g");
    const opens = [...src.matchAll(subRe)].map((m) => m.index);
    if (!ids) { skipped.push(`G${grade} ${topic}: no topic file`); continue; }
    if (ids.length !== opens.length) {
      skipped.push(`G${grade} ${topic}: ${ids.length} sims for ${opens.length} subtopics`);
      continue;
    }
    // Rewrite from the end so earlier offsets stay valid.
    for (let i = opens.length - 1; i >= 0; i--) {
      const span = objectAt(src, opens[i]);
      if (!span) continue;
      const [a, b] = span;
      const body = src.slice(a, b);
      const withoutSims = body.replace(/,?\s*sims:\s*\[[^\]]*\]/, "");
      const next = `${withoutSims.slice(0, -1).trimEnd()}, sims: ["${ids[i]}"] }`;
      if (next !== body) { src = src.slice(0, a) + next + src.slice(b); changed++; }
    }
  }

  if (process.argv.includes("--check")) {
    if (src !== readFileSync(path, "utf8")) {
      console.error(`wire-curriculum: grade${grade}.ts is out of date`);
      process.exit(1);
    }
  } else writeFileSync(path, src);
}

console.log(`wire-curriculum: ${changed} subtopics pointed at their own simulation`);
for (const s of skipped) console.log(`  skipped ${s}`);
