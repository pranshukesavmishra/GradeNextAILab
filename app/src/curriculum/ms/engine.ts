import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import vm from "node:vm";

/**
 * The Grades 6–8 Smart Lab catalogue (msLabs.ts) and the engine (smartlab/)
 * describe the same labs twice. This loads the engine's own lab sources — the
 * core and every sims-g*.js file its index.html loads, in load order — into a
 * bare VM, reads what registered, and fails the moment the two disagree. Then it
 * runs each lab's own apparatus on the numbers its problems and notes promise.
 *
 * A Grades 6–8 lab file must therefore load without a DOM: drawing code may use
 * the page, registration and the model may not.
 */

const SMARTLAB = fileURLToPath(new URL("../../../../smartlab", import.meta.url));

export interface Def {
  id: string; grade?: number; unit?: string; topics?: string[]; name: string; subject: string;
  params: Record<string, unknown>;
  controls: { items: { key: string; options?: { value: string; label: string; teaches?: string[] }[] }[] }[];
  problems?: { params?: Record<string, unknown>; measure: (S: { p: Record<string, unknown> }) => number }[];
}
export interface Engine { __REG: Def[]; InsightLab: { models: Record<string, Record<string, (...a: never[]) => unknown>> } }

function loadEngine(): Engine {
  const html = readFileSync(join(SMARTLAB, "index.html"), "utf8");
  const files = [...html.matchAll(/src="(sims-g\d[a-z]-\d+\.js)"/g)].map((m) => m[1]);
  const ctx: Record<string, unknown> = {
    console, Math, Float64Array, Uint8Array, Array, Object, JSON, Number, String, isFinite,
    Infinity, NaN, Date, Error, performance: { now: () => Date.now() },
  };
  ctx.window = ctx;
  ctx.devicePixelRatio = 1;
  vm.createContext(ctx);
  for (const f of ["lab-core.js", ...files]) {
    vm.runInContext(readFileSync(join(SMARTLAB, f), "utf8"), ctx, { filename: f });
  }
  return ctx as unknown as Engine;
}

export const engine = loadEngine();
export const defs = (engine.__REG ?? []).filter((d) => typeof d.grade === "number");
export const setupsOf = (d: Def) => d.controls.flatMap((g) => g.items).find((i) => i.key === "setup")?.options ?? [];
