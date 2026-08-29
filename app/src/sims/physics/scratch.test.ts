import { describe, it } from "vitest";
import { SimRunner } from "@engine/loop";
import { defaultParams } from "@engine/types";
import type { AnySim, ParamValues } from "@engine/types";
import { heatTransferSim, JACKETS, mugTimeConstant } from "./heat-transfer";

function run(sim: AnySim, overrides: ParamValues, seconds: number) {
  const params = { ...defaultParams(sim.params), ...overrides };
  const runner = new SimRunner({ manifest: sim, params, band: "9-12", seed: "t" });
  runner.playing = true;
  for (let t = 0; t < seconds / 60; t += 1 / 60) runner.advance(1 / 60);
  return runner;
}
const C = (K: number) => K - 273.15;
const HOLD = 427.0462633451957; // W: exactly offsets the wall loss at 20 °C

describe("newton", () => {
  it("holds the room and follows the exponential", () => {
    for (const [j, th] of [["none", 0], ["foam", 0.02]] as const) {
      const tau = mugTimeConstant(JACKETS[j], th);
      for (const mult of [0.5, 1, 2]) {
        const f = run(heatTransferSim, {
          jacket: j, jacketThickness: th, heaterPower: HOLD, outsideT: 273.15,
        }, tau * mult).facts();
        const want = 293.15 + 70 * Math.exp(-mult);
        console.log(j, th, `t=${mult}tau`, "room", C(f.roomT as number).toFixed(4),
          "mug", C(f.mugT as number).toFixed(3), "want", C(want).toFixed(3),
          "err%", (100 * ((f.mugT as number) - want) / (want - 293.15)).toFixed(3));
      }
    }
  });
  it("conduction race", () => {
    for (const mat of ["copper", "aluminium", "steel", "glass", "wood"]) {
      const f = run(heatTransferSim, { barMaterial: mat }, 300).facts();
      console.log(mat, "coldEnd@300s", C(f.barColdEnd as number).toFixed(3),
        "coldBlock", C(f.coldT as number).toFixed(3));
    }
  });
});
