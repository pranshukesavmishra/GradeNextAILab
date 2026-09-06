import { describe, it } from "vitest";
import { SimRunner } from "@engine/loop";
import { defaultParams } from "@engine/types";
import { argumentBridgeSim } from "./a5-5-argument-bridge";

function facts(overrides: any) {
  const params = { ...defaultParams(argumentBridgeSim.params), ...overrides };
  const r = new SimRunner({ manifest: argumentBridgeSim, params, band: "6-8", seed: "dbg" });
  r.playing = true;
  return r.facts();
}

describe("debug a5-5", () => {
  it("timeline day by day", () => {
    let prevSurvivors = 400;
    for (let d = -14; d <= 2; d++) {
      const f = facts({ timelineDay: d });
      const survivors = f.survivors as number;
      console.log(`day ${d}: survivors=${survivors} deaths_today=${prevSurvivors - survivors} mat=${(f.matCoverPct as number).toFixed(1)}%`);
      prevSurvivors = survivors;
    }
  });

  it("oxygen by hour on candidate days", () => {
    for (const d of [-3, -2, -1, 0]) {
      const hours: number[] = [];
      for (let h = 0; h < 24; h++) {
        const f = facts({ timelineDay: d, timelineHour: h });
        hours.push(Math.round((f.oxygenNow as number) * 10) / 10);
      }
      console.log(`day ${d} oxygen by hour:`, hours.join(","));
    }
  });

  it("relevance numbers", () => {
    for (const claim of ["vague", "lowOxygenDawn", "fertiliser", "tooHot", "algaeEatFish"]) {
      const f = facts({ claim, evidenceOxygenDawn: true, evidenceOxygenNoon: true, evidenceNitrateOutfall: true, evidenceTempNoon: true, evidenceAlgaeCover: true, evidenceSalinity: true });
      console.log(claim, {
        oxygenDawn: f.oxygenDawnRelevance, oxygenNoon: f.oxygenNoonRelevance,
        nitrateOutfall: f.nitrateOutfallRelevance, tempNoon: f.tempNoonRelevance,
        argumentStrength: f.argumentStrength, totalDeaths: f.totalDeaths, firstCrashDay: f.firstCrashDay,
      });
    }
  });
});
