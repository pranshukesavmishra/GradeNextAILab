/**
 * Canvas state guard.
 *
 * A drawing function that calls `save()` without a matching `restore()` leaves
 * a clip region or a transform behind, and everything drawn after it in that
 * frame is silently wrong — usually invisible, because the stale clip is the
 * small box the offending function was working in. One imbalance in one art
 * routine can therefore blank the rest of a simulation, and the symptom points
 * nowhere near the cause: the drawing that disappears is the innocent one.
 *
 * This makes that class of bug impossible to propagate. The context is
 * instrumented once so its nesting depth is known, and any call wrapped in
 * `guarded` is returned to the depth it started at, however badly behaved it
 * was. It is a seatbelt, not a licence: an imbalance is still a bug in the
 * routine that caused it, and `onImbalance` exists so a development build can
 * say so out loud.
 */

interface Tracked extends CanvasRenderingContext2D {
  /** Nesting depth, maintained by the patched save/restore. */
  __depth?: number;
  __guarded?: boolean;
}

/** Called with the offending depth change; wired to a console warning in dev. */
let onImbalance: ((delta: number, label: string) => void) | null =
  import.meta.env?.DEV
    ? (delta, label) => console.warn(`[canvas] ${label} left ${delta > 0 ? delta : -delta} state(s) ${delta > 0 ? "unrestored" : "over-restored"}`)
    : null;

export function setImbalanceReporter(fn: ((delta: number, label: string) => void) | null): void {
  onImbalance = fn;
}

function instrument(ctx: Tracked): void {
  if (ctx.__guarded) return;
  const save = ctx.save.bind(ctx);
  const restore = ctx.restore.bind(ctx);
  ctx.__depth = 0;
  ctx.save = () => { ctx.__depth = (ctx.__depth ?? 0) + 1; save(); };
  ctx.restore = () => {
    // Never let a routine pop below where it started: an over-restore would
    // steal a caller's saved state, which is the worse of the two failures.
    if ((ctx.__depth ?? 0) <= 0) return;
    ctx.__depth = (ctx.__depth ?? 0) - 1;
    restore();
  };
  ctx.__guarded = true;
}

/**
 * Run a drawing routine and leave the canvas exactly as it was found.
 *
 * Returns whatever the routine returned, or undefined if it threw — a single
 * failing specimen must not take the whole stage down with it.
 */
export function guarded<T>(
  ctx: CanvasRenderingContext2D, label: string, fn: () => T,
): T | undefined {
  const c = ctx as Tracked;
  instrument(c);
  const before = c.__depth ?? 0;
  c.save();
  let out: T | undefined;
  try {
    out = fn();
  } catch (err) {
    if (import.meta.env?.DEV) console.error(`[canvas] ${label} threw`, err);
  }
  const after = c.__depth ?? 0;
  if (after !== before + 1) onImbalance?.(after - before - 1, label);
  while ((c.__depth ?? 0) > before) c.restore();
  return out;
}
