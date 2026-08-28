/**
 * Counter-based, forkable, deterministic PRNG.
 *
 * Every stochastic sim draws from this and never from Math.random, so a given
 * (seed, params, input log) always replays to an identical state. Forking lets
 * independent subsystems (e.g. each rabbit in an ecosystem) draw without
 * consuming each other's stream, which keeps determinism stable even when a
 * subsystem is added or removed.
 */

const GOLDEN = 0x9e3779b9;

/** Deterministic 32-bit hash of a string — used to derive seeds from sim ids. */
export function hashSeed(text: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

export class Rng {
  private state: number;
  private readonly origin: number;

  constructor(seed: number | string = 1) {
    const s = typeof seed === "string" ? hashSeed(seed) : seed >>> 0;
    this.origin = s >>> 0;
    this.state = s >>> 0;
  }

  /** Uniform in [0, 1). */
  next(): number {
    // mulberry32
    this.state = (this.state + GOLDEN) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Uniform in [min, max). */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  /** True with probability p. */
  chance(p: number): boolean {
    return this.next() < p;
  }

  /** Standard normal via Box-Muller (no cached spare, to keep the stream simple). */
  normal(mean = 0, stdDev = 1): number {
    const u = Math.max(this.next(), Number.EPSILON);
    const v = this.next();
    return mean + stdDev * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  pick<T>(items: readonly T[]): T {
    return items[this.int(0, items.length - 1)];
  }

  /** An independent stream derived from this one — same fork name, same stream. */
  fork(name: string): Rng {
    return new Rng((this.origin ^ hashSeed(name)) >>> 0);
  }

  /** Restore a stream exactly (used by replay and snapshot restore). */
  snapshot(): { origin: number; state: number } {
    return { origin: this.origin, state: this.state };
  }

  static restore(snap: { origin: number; state: number }): Rng {
    const rng = new Rng(snap.origin);
    rng.state = snap.state >>> 0;
    return rng;
  }
}
