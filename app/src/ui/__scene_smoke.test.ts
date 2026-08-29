import { describe, it, expect } from "vitest";
import type { ThemeColors } from "@engine/types";
import * as S from "./scene";

const calls: string[] = [];
function fakeCtx(): CanvasRenderingContext2D {
  const grad = { addColorStop: (o: number, c: string) => { if (!(o >= 0 && o <= 1)) throw new Error("bad offset " + o); if (typeof c !== "string" || !c) throw new Error("bad color " + c); } };
  const target: Record<string, unknown> = {
    canvas: { width: 800, height: 500 },
    createLinearGradient: () => grad,
    createRadialGradient: () => grad,
    measureText: (t: string) => ({ width: t.length * 6 }),
  };
  return new Proxy(target, {
    get(t, k: string) {
      if (k in t) return t[k];
      return (...a: unknown[]) => { calls.push(k); void a; };
    },
    set(t, k: string, v) { t[k] = v; return true; },
  }) as unknown as CanvasRenderingContext2D;
}

const themes: ThemeColors[] = [
  { surface: "#ffffff", surfaceAlt: "#f2f4f8", ink: "#101418", inkSoft: "#5a6472", line: "#d7dce4", grid: "#e4e8ef", accent: "#2f6fed", sci: {} },
  { surface: "#0d1117", surfaceAlt: "#151b23", ink: "#e6edf3", inkSoft: "#9198a1", line: "#30363d", grid: "#21262d", accent: "#6ea8ff", sci: {} },
];

describe("scene premium kit", () => {
  it("runs every new primitive in both themes without throwing", () => {
    for (const theme of themes) {
      const ctx = fakeCtx();
      const pts = Array.from({ length: 40 }, (_, i) => ({ x: i * 3, y: 20 + i, r: 1 + (i % 3), a: (i % 10) / 10 }));
      S.gradientFill(ctx, 0, 0, 200, 100, ["#ff0000", { at: 0.4, color: "#00ff00" }, "#0000ff"], 33);
      S.gradientFill(ctx, 0, 0, 200, 100, ["#ff0000"], 0);
      S.gradientFill(ctx, 0, 0, 0, 100, ["#ff0000"]);
      S.gradient(ctx, 0, 0, 10, 10, [], 90);
      S.glass(ctx, 10, 10, 120, 200, 12, theme);
      S.glass(ctx, 10, 10, 120, 200, 12, theme, { tint: "#88ccff", alpha: 0.3, sheen: false, edge: "#fff" });
      S.metal(ctx, 0, 0, 40, 300, "#9aa3ad", { radius: 6, angle: 0, polish: 0.6 });
      S.plastic(ctx, 0, 0, 60, 30, "#e2574c", { matte: true });
      S.plastic(ctx, 0, 0, 60, 30, "#e2574c");
      S.softShadow(ctx, () => calls.push("inner"), { blur: 10, dy: 3, alpha: 0.3, color: "#001122" });
      const shape = (c: CanvasRenderingContext2D) => { c.beginPath(); c.arc(50, 50, 30, 0, Math.PI * 2); };
      S.innerGlow(ctx, shape, "#ffaa00", { inset: 8, steps: 4 });
      S.rimLight(ctx, shape, "#ffffff", { bounds: { x: 20, y: 20, w: 60, h: 60 } });
      S.rimLight(ctx, shape, "#ffffff");
      S.particleField(ctx, pts, "#33ddaa", { size: 2, glow: 6 });
      S.particleField(ctx, pts.map((p) => ({ x: p.x, y: p.y })), "#33ddaa", { buckets: 1 });
      S.particleField(ctx, [], "#fff");
      S.arcGauge(ctx, 100, 100, 40, 0.62, theme.accent, theme, "62%", { sub: "charge", ticks: 9 });
      S.arcGauge(ctx, 100, 100, 40, 0, theme.accent, theme);
      S.arcGauge(ctx, 100, 100, 1, 2, theme.accent, theme);
      S.ribbon(ctx, pts, 12, "#ff0066", "#ffcc00", { core: true, alpha: 0.9 });
      S.ribbon(ctx, [{ x: 0, y: 0 }, { x: 0, y: 0 }], 6, "#fff", "#000");
      S.ribbon(ctx, [{ x: 0, y: 0 }], 6, "#fff", "#000");
      S.dashFlow(ctx, pts, "#00aaff", 12.5, { glow: 5 });
      S.gridPaper(ctx, 800, 500, theme, { step: 20, major: 5, fade: 0.5, originX: 7, originY: -13 });
      S.gridPaper(ctx, 800, 500, theme);
      const p1 = S.labelLeader(ctx, 400, 250, 620, 120, "Left ventricle", theme, { sub: "thick wall" });
      const p2 = S.labelLeader(ctx, 400, 250, 100, 380, "Aorta", theme, { align: "left", plate: false, dot: false });
      expect(p1.w).toBeGreaterThan(0);
      expect(p2.h).toBeGreaterThan(0);
      expect(p1.x).toBeGreaterThanOrEqual(620);
      S.spriteShadowEllipse(ctx, 100, 300, 40, 10);
      S.bevelRect(ctx, 10, 10, 100, 40, 8, "#4477cc", { depth: -2 });
      S.bevelRect(ctx, 10, 10, 100, 40, 8, "#4477cc", { fill: false });
      S.hatchFill(ctx, 0, 0, 100, 100, theme.inkSoft, { gap: 6, angle: -30 });
      S.noiseWash(ctx, 0, 0, 800, 500, { alpha: 0.04, seed: 3 });
      S.noiseWash(ctx, 0, 0, 800, 500, { count: 0 });
    }
    expect(calls.includes("inner")).toBe(true);
    expect(calls.includes("fill")).toBe(true);
  });

  it("easing curves are well behaved", () => {
    expect(S.easeInOut(0)).toBe(0);
    expect(S.easeInOut(1)).toBe(1);
    expect(S.easeInOut(0.5)).toBeCloseTo(0.5, 6);
    expect(S.easeInOut(-3)).toBe(0);
    expect(S.spring(0)).toBe(0);
    expect(S.spring(1)).toBe(1);
    expect(S.spring(0.9)).toBeGreaterThan(0.9);
    expect(S.pulse(0, 1)).toBeCloseTo(0.5, 6);
    expect(S.pulse(0.25, 1)).toBeCloseTo(1, 6);
    expect(S.clamp01(2)).toBe(1);
    expect(S.lerp(10, 20, 0.5)).toBe(15);
    // Existing exports must still be there.
    for (const k of ["sky", "starfield", "groundPlane", "vignette", "sphere", "contactShadow", "material", "glow", "comet", "badge", "caption", "hexA", "lifted", "isDarkTheme"]) {
      expect(typeof (S as unknown as Record<string, unknown>)[k]).toBe("function");
    }
  });
});
