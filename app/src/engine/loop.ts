import { Rng } from "./rng";
import type {
  AnySim, DataRow, GradeBand, ParamValues, Readout, SimContext, SimInput,
} from "./types";

/**
 * The deterministic simulation runtime.
 *
 * A fixed timestep accumulator advances the model in exact increments so that
 * the same (seed, params, input log) always produces the same result, no matter
 * the device frame rate. Rendering interpolates between model states, which is
 * what keeps motion smooth at 30 fps on a low-end Chromebook while the physics
 * still runs at 120 Hz.
 */

export interface InputLogEntry {
  tick: number;
  input: SimInput;
}

export interface ReplayData {
  seed: number | string;
  params: ParamValues;
  band: GradeBand;
  inputs: InputLogEntry[];
}

export interface RunnerOptions {
  manifest: AnySim;
  params: ParamValues;
  band: GradeBand;
  seed?: number | string;
  messiness?: number;
}

const MAX_FRAME_SECONDS = 0.25; // clamp catch-up so a stalled tab cannot spiral

export class SimRunner {
  readonly manifest: AnySim;
  private state: unknown;
  private prevState: unknown;
  private accumulator = 0;
  private readonly dt: number;

  params: ParamValues;
  band: GradeBand;
  /** Simulated seconds elapsed. */
  time = 0;
  /** Model ticks executed — the determinism counter. */
  ticks = 0;
  /** 0 = paused. 1 = real time. 0.1 = slow motion. 100 = fast-forward. */
  speed = 1;
  playing = false;
  messiness: number;

  private rng: Rng;
  private seed: number | string;
  private inputQueue: SimInput[] = [];
  /** Recorded for replay and teacher review. */
  private inputLog: InputLogEntry[] = [];

  constructor(opts: RunnerOptions) {
    this.manifest = opts.manifest;
    this.params = { ...opts.params };
    this.band = opts.band;
    this.messiness = opts.messiness ?? 0;
    this.seed = opts.seed ?? opts.manifest.id;
    this.rng = new Rng(this.seed);
    this.dt = 1 / (opts.manifest.tickRate ?? 120);
    this.state = this.manifest.model.init(this.params, this.context());
    this.prevState = this.state;
  }

  private context(): SimContext {
    return { rng: this.rng, band: this.band, time: this.time, messiness: this.messiness };
  }

  /** Restart from the current parameters, preserving band and seed. */
  reset(): void {
    this.rng = new Rng(this.seed);
    this.time = 0;
    this.ticks = 0;
    this.accumulator = 0;
    this.inputQueue = [];
    this.inputLog = [];
    this.state = this.manifest.model.init(this.params, this.context());
    this.prevState = this.state;
  }

  setParams(next: ParamValues): void {
    const prev = this.params;
    this.params = { ...next };
    if (this.manifest.model.applyParams) {
      this.state = this.manifest.model.applyParams(this.state, this.params, prev, this.context());
      this.prevState = this.state;
    }
  }

  setBand(band: GradeBand): void {
    this.band = band;
  }

  setSeed(seed: number | string): void {
    this.seed = seed;
    this.reset();
  }

  push(input: SimInput): void {
    this.inputQueue.push(input);
  }

  /**
   * Advance by a real-time delta. Returns true when at least one tick ran, so
   * the caller knows whether derived values need recomputing.
   */
  advance(realSeconds: number): boolean {
    if (!this.playing || this.speed === 0) {
      // Inputs still apply while paused, so dragging an object works when stopped.
      if (this.inputQueue.length) this.tick(0);
      return false;
    }
    // Clamped at both ends. A caller that hands over a negative delta — a
    // clock that stepped backwards, a frame timestamp older than the moment
    // the loop started — would otherwise drive the accumulator negative, and
    // from there it never again reaches a single tick: the simulation sits at
    // zero seconds and looks, correctly, broken.
    const step = Math.max(0, Math.min(realSeconds, MAX_FRAME_SECONDS));
    const scaled = step * this.speed * (this.manifest.timeScale ?? 1);
    this.accumulator = Math.max(0, this.accumulator + scaled);

    let ran = false;
    // Cap ticks per frame so fast-forward never blocks the main thread.
    let budget = 2000;
    while (this.accumulator >= this.dt && budget-- > 0) {
      this.tick(this.dt);
      this.accumulator -= this.dt;
      ran = true;
    }
    if (budget <= 0) this.accumulator = 0;
    return ran;
  }

  /** Run exactly one model tick, regardless of play state. */
  stepOnce(): void {
    this.tick(this.dt);
  }

  private tick(dt: number): void {
    const inputs = this.inputQueue;
    this.inputQueue = [];
    if (inputs.length) {
      for (const input of inputs) this.inputLog.push({ tick: this.ticks, input });
    }
    this.prevState = this.state;
    this.state = this.manifest.model.step(this.state, dt, this.params, this.context(), inputs);
    this.time += dt;
    this.ticks++;
  }

  getState(): unknown {
    return this.state;
  }

  getPrevState(): unknown {
    return this.prevState;
  }

  /** Fraction of the way from prevState to state, for smooth rendering. */
  get alpha(): number {
    return this.dt > 0 ? Math.min(1, this.accumulator / this.dt) : 1;
  }

  readouts(): Readout[] {
    return this.manifest.model.readouts(this.state, this.params, this.context());
  }

  facts(): Record<string, number | boolean | string> {
    return this.manifest.model.facts?.(this.state, this.params) ?? {};
  }

  /** Flat numeric map of readouts, used by graphs, labs, and the data table. */
  readoutValues(): Record<string, number> {
    const out: Record<string, number> = {};
    for (const r of this.readouts()) out[r.key] = r.quantity.value;
    return out;
  }

  snapshotRow(): DataRow {
    return { t: this.time, values: this.readoutValues() };
  }

  /** A compact fingerprint of state, used by determinism tests. */
  fingerprint(): string {
    const json = JSON.stringify(this.state);
    let h = 2166136261 >>> 0;
    for (let i = 0; i < json.length; i++) {
      h ^= json.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return `${this.ticks}:${(h >>> 0).toString(16)}`;
  }

  /** Everything needed to reproduce this run elsewhere. */
  replayData(): ReplayData {
    return { seed: this.seed, params: this.params, band: this.band, inputs: [...this.inputLog] };
  }
}
