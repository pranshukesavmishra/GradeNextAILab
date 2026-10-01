import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SimRunner } from "./loop";
import { defaultParams } from "./types";
import type { AnySim, DataRow, GradeBand, ParamValues, Readout, SimInput } from "./types";

export interface UseSimOptions {
  manifest: AnySim;
  band: GradeBand;
  initialParams?: ParamValues;
  /** Recording interval in simulated seconds; 0 disables auto-recording. */
  sampleInterval?: number;
  maxSamples?: number;
}

export interface SimHandle {
  runner: SimRunner;
  params: ParamValues;
  setParam: (key: string, value: number | boolean | string) => void;
  setParams: (next: ParamValues) => void;
  resetParams: () => void;
  readouts: Readout[];
  playing: boolean;
  speed: number;
  time: number;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  stepOnce: () => void;
  reset: () => void;
  setSpeed: (s: number) => void;
  /** Continuously sampled series for live graphing. */
  series: DataRow[];
  /** Rows the student deliberately recorded. */
  data: DataRow[];
  recordPoint: () => void;
  clearData: () => void;
  push: (input: SimInput) => void;
  /** Bumped every animation frame so views re-render. */
  frame: number;
  setBand: (band: GradeBand) => void;
  overlays: Record<string, boolean>;
  toggleOverlay: (key: string) => void;
  messiness: number;
  setMessiness: (v: number) => void;
}

/**
 * Drives a simulation from React. The runner owns the model; React only holds
 * a frame counter and the small pieces of UI state, so a 120 Hz physics loop
 * never causes 120 React renders per second.
 */
export function useSim(opts: UseSimOptions): SimHandle {
  const { manifest, band, sampleInterval = 0.05, maxSamples = 1200 } = opts;

  const initial = useMemo(
    () => opts.initialParams ?? defaultParams(manifest.params),
    // Rebuild only when the sim itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [manifest.id],
  );

  const runnerRef = useRef<SimRunner | null>(null);
  if (runnerRef.current === null || runnerRef.current.manifest.id !== manifest.id) {
    runnerRef.current = new SimRunner({ manifest, params: initial, band });
    runnerRef.current.playing = true;
  }
  const runner = runnerRef.current;

  const [params, setParamsState] = useState<ParamValues>(initial);
  // Simulations start running. A science simulation that opens frozen reads as
  // broken: the student sees a still picture, and nothing invites them to press
  // anything. Whatever the sim does - particles jostling, a heart beating, a
  // wave travelling - is the reason it exists, so it should already be doing it.
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeedState] = useState(1);
  const [frame, setFrame] = useState(0);
  const [series, setSeries] = useState<DataRow[]>([]);
  const [data, setData] = useState<DataRow[]>([]);
  const [messiness, setMessinessState] = useState(0);
  const [overlays, setOverlays] = useState<Record<string, boolean>>(() => {
    const out: Record<string, boolean> = {};
    for (const o of manifest.overlays ?? []) out[o.key] = o.default;
    return out;
  });

  // Reset per-sim UI state when the simulation changes.
  useEffect(() => {
    setParamsState(initial);
    setPlaying(false);
    setSpeedState(1);
    setSeries([]);
    setData([]);
    const out: Record<string, boolean> = {};
    for (const o of manifest.overlays ?? []) out[o.key] = o.default;
    setOverlays(out);
  }, [manifest.id, initial, manifest.overlays]);

  useEffect(() => {
    runner.setBand(band);
  }, [band, runner]);

  useEffect(() => {
    runner.messiness = messiness;
  }, [messiness, runner]);

  // The animation loop: advance the model, sample series, bump the frame.
  const lastSampleRef = useRef(0);
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let mounted = true;

    const tick = () => {
      if (!mounted) return;
      // Measured from `performance.now()`, never from the timestamp the frame
      // callback is handed. Those two can disagree — the first frame after a
      // slow start-up arrives carrying a timestamp from before the loop was
      // set up — and a negative delta drives the runner's accumulator deeply
      // negative, after which it never reaches one tick and the simulation
      // stays frozen at zero seconds for as long as the page is open.
      const now = performance.now();
      const delta = Math.max(0, (now - last) / 1000);
      last = now;
      const ran = runner.advance(delta);

      if (ran && sampleInterval > 0 && runner.time - lastSampleRef.current >= sampleInterval) {
        lastSampleRef.current = runner.time;
        const row = runner.snapshotRow();
        setSeries((prev) => {
          const next = prev.length >= maxSamples ? prev.slice(prev.length - maxSamples + 1) : prev.slice();
          next.push(row);
          return next;
        });
      }
      setFrame((f) => (f + 1) % 1_000_000);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    const onVisibility = () => {
      // Avoid a huge catch-up delta when a backgrounded tab returns.
      last = performance.now();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      mounted = false;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [runner, sampleInterval, maxSamples]);

  const setParam = useCallback(
    (key: string, value: number | boolean | string) => {
      setParamsState((prev) => {
        const next = { ...prev, [key]: value };
        runner.setParams(next);
        return next;
      });
    },
    [runner],
  );

  const setParams = useCallback(
    (next: ParamValues) => {
      setParamsState(next);
      runner.setParams(next);
    },
    [runner],
  );

  const resetParams = useCallback(() => {
    const fresh = defaultParams(manifest.params);
    setParamsState(fresh);
    runner.setParams(fresh);
    runner.reset();
    setSeries([]);
    lastSampleRef.current = 0;
  }, [manifest.params, runner]);

  const play = useCallback(() => {
    runner.playing = true;
    setPlaying(true);
  }, [runner]);

  const pause = useCallback(() => {
    runner.playing = false;
    setPlaying(false);
  }, [runner]);

  const toggle = useCallback(() => {
    runner.playing = !runner.playing;
    setPlaying(runner.playing);
  }, [runner]);

  const stepOnce = useCallback(() => {
    runner.stepOnce();
    setFrame((f) => f + 1);
  }, [runner]);

  const reset = useCallback(() => {
    runner.reset();
    runner.playing = false;
    setPlaying(false);
    setSeries([]);
    lastSampleRef.current = 0;
    setFrame((f) => f + 1);
  }, [runner]);

  const setSpeed = useCallback(
    (s: number) => {
      runner.speed = s;
      setSpeedState(s);
    },
    [runner],
  );

  const recordPoint = useCallback(() => {
    setData((prev) => [...prev, { ...runner.snapshotRow(), trial: prev.length + 1 }]);
  }, [runner]);

  const clearData = useCallback(() => setData([]), []);

  const push = useCallback((input: SimInput) => runner.push(input), [runner]);

  const toggleOverlay = useCallback((key: string) => {
    setOverlays((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const setBand = useCallback((b: GradeBand) => runner.setBand(b), [runner]);

  // Recomputed each frame; cheap because readouts are simple derived values.
  const readouts = useMemo(() => runner.readouts(), [runner, frame]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    runner, params, setParam, setParams, resetParams, readouts,
    playing, speed, time: runner.time, play, pause, toggle, stepOnce, reset, setSpeed,
    series, data, recordPoint, clearData, push, frame, setBand,
    overlays, toggleOverlay, messiness, setMessiness: setMessinessState,
  };
}
