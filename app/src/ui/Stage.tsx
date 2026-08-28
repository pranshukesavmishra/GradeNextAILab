import { useCallback, useEffect, useRef } from "react";
import type { AnySim, GradeBand, ParamValues, RenderContext, SimInput } from "@engine/types";
import { readTheme } from "./theme";

interface StageProps {
  manifest: AnySim;
  state: unknown;
  params: ParamValues;
  band: GradeBand;
  overlays: Record<string, boolean>;
  alpha: number;
  time: number;
  themeKey: string;
  /** Bumped every frame so the canvas redraws. */
  frame: number;
  onInput?: (input: SimInput) => void;
  /** World-space size the sim draws in; the stage letterboxes to fit. */
  ariaDescription?: string;
}

/**
 * The canvas the phenomenon lives on.
 *
 * Handles device-pixel ratio, resize, pointer translation, and a per-frame
 * redraw. Simulations receive a plain 2D context and never touch the DOM,
 * which keeps them portable and testable.
 */
export function Stage(props: StageProps) {
  const { manifest, state, params, band, overlays, alpha, time, themeKey, frame, onInput, ariaDescription } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef({ w: 0, h: 0 });

  // Keep the backing store matched to the element size and pixel ratio.
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      // Cap DPR at 2: beyond that the cost outweighs any visible gain,
      // which matters on the low-end Chromebooks this must run on.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      sizeRef.current = { w, h };
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(wrap);
    window.addEventListener("orientationchange", resize);
    return () => {
      observer.disconnect();
      window.removeEventListener("orientationchange", resize);
    };
  }, []);

  // Draw. Runs on every frame tick from the sim hook.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const { w, h } = sizeRef.current;
    if (w === 0 || h === 0) return;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const theme = readTheme(themeKey);
    ctx.fillStyle = theme.surface;
    ctx.fillRect(0, 0, w, h);

    const rc: RenderContext<unknown> = {
      ctx, state, params, band, width: w, height: h, overlays, alpha, theme, time,
    };
    try {
      manifest.render(rc);
    } catch (err) {
      // A failing sim must not take the whole shell down.
      ctx.fillStyle = theme.inkSoft;
      ctx.font = "14px system-ui, sans-serif";
      ctx.fillText("This simulation hit an error and stopped drawing.", 16, 28);
      if (import.meta.env.DEV) console.error(`[sim:${manifest.id}]`, err);
    }
    ctx.restore();
  }, [manifest, state, params, band, overlays, alpha, time, themeKey, frame]);

  const toWorld = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const handlePointer = useCallback(
    (type: SimInput["type"]) => (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!onInput) return;
      if (type === "pointerdown") e.currentTarget.setPointerCapture(e.pointerId);
      const { x, y } = toWorld(e);
      onInput({ type: type as "pointerdown" | "pointermove" | "pointerup", x, y, id: e.pointerId });
    },
    [onInput, toWorld],
  );

  return (
    <div ref={wrapRef} className="stage-wrap">
      <canvas
        ref={canvasRef}
        className="stage-canvas"
        role="img"
        aria-label={ariaDescription ?? `${manifest.title} simulation`}
        onPointerDown={handlePointer("pointerdown")}
        onPointerMove={handlePointer("pointermove")}
        onPointerUp={handlePointer("pointerup")}
        onPointerCancel={handlePointer("pointerup")}
      />
    </div>
  );
}
