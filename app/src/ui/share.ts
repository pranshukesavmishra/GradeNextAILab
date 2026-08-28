import type { GradeBand, ParamSchema, ParamValues } from "@engine/types";

/**
 * Shareable experiment links.
 *
 * The whole setup travels in the URL, so a teacher can hand students an exact
 * starting configuration and a student can submit the precise state they
 * measured. Values are compact-encoded rather than raw JSON to keep links
 * short enough to paste into any chat or worksheet.
 */

export function encodeShareQuery(params: ParamValues): string {
  return Object.entries(params)
    .map(([k, v]) => {
      if (typeof v === "number") return `${k}~${trimFloat(v)}`;
      if (typeof v === "boolean") return `${k}~${v ? "1" : "0"}`;
      return `${k}~${encodeURIComponent(String(v))}`;
    })
    .join("!");
}

export function encodeShare(simId: string, band: GradeBand, params: ParamValues): string {
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}#/sim/${encodeURIComponent(simId)}/${encodeURIComponent(band)}?${encodeShareQuery(params)}`;
}

/** Parse the params fragment of a share link back into values. */
export function decodeShare(query: string, schema: ParamSchema): ParamValues {
  const out: ParamValues = {};
  if (!query) return out;
  for (const pair of query.split("!")) {
    const idx = pair.indexOf("~");
    if (idx <= 0) continue;
    const key = pair.slice(0, idx);
    const raw = pair.slice(idx + 1);
    const spec = schema[key];
    if (!spec) continue;

    if (spec.type === "number") {
      const n = Number(raw);
      // Clamp to the declared range: a hand-edited link must never put a
      // simulation into a state its model was not written to handle.
      if (Number.isFinite(n)) out[key] = Math.min(spec.max, Math.max(spec.min, n));
    } else if (spec.type === "boolean") {
      out[key] = raw === "1" || raw === "true";
    } else {
      const value = decodeURIComponent(raw);
      if (spec.options.some((o) => o.value === value)) out[key] = value;
    }
  }
  return out;
}

/** Six significant digits is plenty for a slider value and keeps links short. */
function trimFloat(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return String(Number(n.toPrecision(6)));
}
