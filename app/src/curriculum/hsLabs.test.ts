import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { HS_LABS } from "./hsLabs";

/**
 * The Higher Secondary catalogue (hsLabs.ts) and the Smart Lab engine
 * (smartlab/) describe the same labs in two languages. This reads the engine's
 * own sources — the scripts its index.html loads, in load order — and fails the
 * moment the two disagree, so a lab can never be added, renamed or dropped in
 * one place and silently left stale in the other.
 */

const SMARTLAB = fileURLToPath(new URL("../../../smartlab", import.meta.url));

interface SourceLab { id: string; subject: string; name: string; chapter: string; grade: boolean; file: string }

function field(head: string, key: string): string | null {
  const m = new RegExp(`\\b${key}\\s*:\\s*(['"\`])((?:\\\\.|(?!\\1).)*)\\1`).exec(head);
  return m ? m[2].replace(/\\(['"`\\])/g, "$1") : null;
}

function sourceLabs(): SourceLab[] {
  const html = readFileSync(join(SMARTLAB, "index.html"), "utf8");
  const files = [...html.matchAll(/src="(sims-[^"]+\.js)"/g)].map((m) => m[1]);
  const out: SourceLab[] = [];
  for (const file of files) {
    const src = readFileSync(join(SMARTLAB, file), "utf8");
    // The identity fields sit at the head of each registration, before the
    // first behavioural key; `grade` there marks a Grades 6–8 lab.
    const re = /L\.register\(\{([\s\S]*?)\n\s*(?:lede|params|controls|stageHint|is3D|autoplay)\s*:/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(src))) {
      const head = m[1];
      out.push({
        id: field(head, "id") ?? "",
        subject: field(head, "subject") ?? "",
        name: field(head, "name") ?? "",
        chapter: field(head, "chapter") ?? "",
        grade: /\bgrade\s*:/.test(head),
        file,
      });
    }
  }
  return out;
}

describe("Higher Secondary catalogue matches the Smart Lab engine", () => {
  const engine = sourceLabs();
  const hsEngine = engine.filter((l) => !l.grade);

  it("reads every registered lab out of the engine's own sources", () => {
    expect(engine.length).toBeGreaterThanOrEqual(42);
    for (const l of engine) expect(l.id, `${l.file}: a registration without an id`).not.toBe("");
  });

  it("lists exactly the engine's Higher Secondary labs, in the engine's rail order", () => {
    expect(HS_LABS.map((l) => l.id)).toEqual(hsEngine.map((l) => l.id));
  });

  it("has no duplicate ids", () => {
    expect(new Set(HS_LABS.map((l) => l.id)).size).toBe(HS_LABS.length);
  });

  it("carries each lab's own subject, chapter and name, so a rename in the engine shows up here", () => {
    for (const lab of HS_LABS) {
      const src = hsEngine.find((l) => l.id === lab.id);
      expect(src, lab.id).toBeDefined();
      expect(lab.subject, lab.id).toBe(src!.subject);
      expect(lab.chapter, lab.id).toBe(src!.chapter);
      expect(lab.name, lab.id).toBe(src!.name);
    }
  });

  it("tags every lab with the NCERT class of its chapter, and keeps a chapter in one class", () => {
    const byChapter = new Map<string, number>();
    for (const lab of HS_LABS) {
      expect([11, 12], lab.id).toContain(lab.ncertClass);
      const seen = byChapter.get(lab.chapter);
      if (seen !== undefined) expect(lab.ncertClass, lab.chapter).toBe(seen);
      byChapter.set(lab.chapter, lab.ncertClass);
    }
  });
});
