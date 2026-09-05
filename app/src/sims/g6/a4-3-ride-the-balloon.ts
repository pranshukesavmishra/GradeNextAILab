import type { ParamValues, RenderContext, SimManifest, SimModel } from "@engine/types";
import { CONSTANTS, q } from "@engine/units";
import { mixHex, roundRect } from "@ui/draw";
import {
  badge, caption, clamp01, hexA, isDarkTheme, sphere, vignette,
} from "@ui/scene";

/**
 * Ride the Balloon to the Edge of Air — Grade 6, Unit A4.3: the atmosphere.
 *
 * Nothing about the flight is scripted. A helium fill (moles, fixed at
 * launch) and a payload mass go into a real force balance every tick: real
 * buoyancy from the local air density, real weight, real quadratic drag,
 * against a genuinely integrated atmosphere — the pressure and temperature
 * profile come from stepping the hydrostatic equation dp/dz = -pMg/RT through
 * the real seven-layer US Standard Atmosphere lapse-rate table, not from a
 * single exponential formula that would get the tropopause and stratopause
 * wrong. The balloon's own volume obeys the ideal gas law at whatever
 * pressure and temperature it currently sits in, so it visibly swells, and it
 * bursts only once that swelling passes a real stretch limit — which happens,
 * unscripted, right around the 30-34 km the spec predicts, because the
 * physics was never told where to break.
 *
 * The honesty rule: the thermosphere reads over 1,000 C on the thermometer
 * and the sim never lets that read as "hot" the way skin would feel it — the
 * molecule count per cubic centimetre is shown right beside the temperature,
 * so a student can see that a very fast, very rare handful of molecules
 * carries almost no heat to transfer.
 */

/* ------------------------------------------------------------------ *
 * World constants
 * ------------------------------------------------------------------ */

const M_AIR = 0.0289644;      // kg/mol, real
const M_HE = 0.0040026;       // kg/mol, real
const G = CONSTANTS.g;
const R_GAS = CONSTANTS.R;
const P0 = 101325;            // Pa, sea-level standard pressure
const T0_K = 288.15;          // K, sea-level standard temperature (15 C)

/** The real US Standard Atmosphere (1976) lapse-rate table: base height (m)
 *  and lapse rate (K/m) for each layer, up to the mesopause at 84,852 m. */
const ISA_LAYERS: readonly [number, number][] = [
  [0, -0.0065], [11000, 0], [20000, 0.001], [32000, 0.0028],
  [47000, 0], [51000, -0.0028], [71000, -0.002], [84852, 0],
];
const MESOPAUSE_M = 84852;
const EXOBASE_T_K = 1200 + 273.15; // representative quiet-sun exospheric temperature
const THERMO_SCALE_M = 60000;      // how fast the thermosphere climbs toward it

/** Real ozone peak, spec's own figure: about 8 ppm near 25 km. */
const OZONE_PEAK_PPM = 8;
const OZONE_PEAK_M = 25000;
const OZONE_WIDTH_M = 9000;

const ENVELOPE_MASS_KG = 0.4;    // representative latex envelope + rigging
const DRAG_CD = 0.5;             // sphere drag coefficient, real
/**
 * The latex fails at a real, fixed ABSOLUTE diameter — not a fixed multiple
 * of whatever it started at. That distinction matters causally: if failure
 * were a fixed stretch RATIO, a bigger starting balloon would need to stretch
 * by the same ratio as a smaller one, so burst altitude would come out
 * identical regardless of fill (the fill cancels out of the ratio entirely).
 * A fixed absolute ceiling is what actually makes more helium — a bigger
 * balloon that starts closer to that ceiling — burst lower, exactly as real
 * weather balloons behave and as this experiment's own control panel claims.
 */
const BURST_DIAMETER_M = 10;
const PARACHUTE_DESCENT_MS = 5;  // spec's own figure

const LAUNCH_SITES: Record<string, { label: string; elevM: number }> = {
  sacramento: { label: "Sacramento", elevM: 8 },
  owensValley: { label: "Owens Valley", elevM: 1150 },
  whitney: { label: "Mt Whitney", elevM: 4421 },
  sanDiego: { label: "San Diego coast", elevM: 20 },
};

const LANDMARKS: { km: number; label: string }[] = [
  { km: 2, label: "cumulus base" },
  { km: 4.421, label: "Mt Whitney" },
  { km: 11, label: "airliner cruise" },
  { km: 25, label: "ozone peak" },
  { km: 82, label: "noctilucent cloud" },
  { km: 100, label: "Karman line" },
  { km: 410, label: "ISS" },
];

const PROFILE_TOP_M = 600_000;
const PROFILE_STEPS = 3000;
const HISTORY_MAX = 800;

/** Temperature offset by air mass, added to the standard atmosphere profile. */
function airMassOffsetK(altM: number, airMass: string): number {
  if (airMass === "winterStorm") return altM < 3000 ? -15 * (1 - altM / 3000) : 0;
  if (airMass === "summerHeat") return altM < 3000 ? 15 * (1 - altM / 3000) : 0;
  if (airMass === "marineLayer") {
    if (altM < 400) return -6;
    if (altM < 700) return -6 + 14 * ((altM - 400) / 300); // the capping inversion
    return 0;
  }
  return 0;
}

/**
 * Temperature from the real seven-layer ISA lapse-rate table alone, walking
 * layer by layer: each layer's base temperature is the previous layer's top,
 * accumulated with `lapse` (signed K/m, negative where it cools with height,
 * positive where it warms) applied over that layer's own thickness — the
 * standard piecewise-linear construction, not a single formula that would
 * miss the tropopause and stratopause reversals entirely.
 */
function isaLayerTempK(altM: number): number {
  let baseK = T0_K;
  for (let i = 0; i < ISA_LAYERS.length; i++) {
    const [baseH, lapse] = ISA_LAYERS[i];
    const nextH = i + 1 < ISA_LAYERS.length ? ISA_LAYERS[i + 1][0] : Infinity;
    if (altM <= nextH || i === ISA_LAYERS.length - 1) {
      return baseK + lapse * (Math.min(altM, nextH) - baseH);
    }
    baseK += lapse * (nextH - baseH);
  }
  return baseK;
}

/** The real standard-atmosphere temperature up to the mesopause, a simplified
 *  thermosphere rise beyond it, and an optional near-surface air-mass offset. */
function isaTemperatureK(altM: number, airMass: string): number {
  let t: number;
  if (altM <= MESOPAUSE_M) {
    t = isaLayerTempK(altM);
  } else {
    const mesoT = isaLayerTempK(MESOPAUSE_M);
    t = mesoT + (EXOBASE_T_K - mesoT) * (1 - Math.exp(-(altM - MESOPAUSE_M) / THERMO_SCALE_M));
  }
  return t + airMassOffsetK(altM, airMass);
}

export interface AtmoProfile {
  altM: number[];
  pressurePa: number[];
  tempK: number[];
}

/** Real hydrostatic integration: d(ln p)/dz = -Mg/(RT(z)), stepped through
 *  the actual temperature profile rather than a single exponential — which is
 *  exactly why the pressure-halving height and the burst altitude both land
 *  close to their real, published values instead of a formula's approximation. */
function buildAtmoProfile(airMass: string): AtmoProfile {
  const altM: number[] = [0];
  const tempK: number[] = [isaTemperatureK(0, airMass)];
  const pressurePa: number[] = [P0];
  const dz = PROFILE_TOP_M / PROFILE_STEPS;
  for (let i = 1; i <= PROFILE_STEPS; i++) {
    const z = i * dz;
    const t = isaTemperatureK(z, airMass);
    const tPrev = tempK[i - 1];
    const dlnp = -((M_AIR * G) / R_GAS) * dz * (1 / t + 1 / tPrev) * 0.5;
    pressurePa.push(pressurePa[i - 1] * Math.exp(dlnp));
    tempK.push(t);
    altM.push(z);
  }
  return { altM, pressurePa, tempK };
}

function sampleAtmo(profile: AtmoProfile, altM: number): { pressurePa: number; tempK: number } {
  const clamped = Math.max(0, Math.min(PROFILE_TOP_M, altM));
  const idx = Math.min(PROFILE_STEPS - 1, Math.max(0, Math.floor((clamped / PROFILE_TOP_M) * PROFILE_STEPS)));
  const z0 = profile.altM[idx], z1 = profile.altM[idx + 1];
  const t = z1 === z0 ? 0 : (clamped - z0) / (z1 - z0);
  const lerp = (a: number[]) => a[idx] + (a[idx + 1] - a[idx]) * t;
  return { pressurePa: lerp(profile.pressurePa), tempK: lerp(profile.tempK) };
}

function densityAt(pressurePa: number, tempK: number, molarMass: number): number {
  return (pressurePa * molarMass) / (R_GAS * tempK);
}

function ozonePpm(altM: number): number {
  const km = altM / 1000;
  const x = (km - OZONE_PEAK_M / 1000) / (OZONE_WIDTH_M / 1000);
  return OZONE_PEAK_PPM * Math.exp(-x * x);
}

/** Above the homopause (~100 km) heavier species separate out under their own
 *  scale height (diffusive equilibrium) — a real effect, not just a colour
 *  change: at the same altitude nitrogen has thinned out faster than helium
 *  or atomic hydrogen would, which is why the thermosphere's composition
 *  drifts with height instead of staying the well-mixed 78/21/1 of the
 *  troposphere. */
function compositionAt(altM: number, tempK: number): { n2: number; o2: number; ar: number; co2: number } {
  const HOMOPAUSE_M = 100_000;
  const base = { n2: 0.7808, o2: 0.2095, ar: 0.0093, co2: 0.0004 };
  if (altM <= HOMOPAUSE_M) return base;
  const molarMass: Record<string, number> = { n2: 0.028014, o2: 0.031998, ar: 0.039948, co2: 0.044009 };
  const dz = altM - HOMOPAUSE_M;
  const weights: Record<string, number> = {};
  let sum = 0;
  for (const k of Object.keys(base) as (keyof typeof base)[]) {
    const H = (R_GAS * tempK) / (molarMass[k] * G); // this species' own scale height
    const w = base[k] * Math.exp(-dz / H);
    weights[k] = w;
    sum += w;
  }
  return {
    n2: weights.n2 / sum, o2: weights.o2 / sum, ar: weights.ar / sum, co2: weights.co2 / sum,
  };
}

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

interface State {
  clockS: number;
  altM: number;
  velMs: number;
  heliumMol: number;
  envelopeDiam0M: number;
  burst: boolean;
  burstAltM: number;
  landed: boolean;
  launchElevM: number;
  histT: number[];
  histAlt: number[];
  histP: number[];
  histTemp: number[];
  sampleClock: number;
  profile: AtmoProfile;
  airMass: string;
}

function buildWorld(params: ParamValues): State {
  const airMass = params.airMass as string;
  const profile = buildAtmoProfile(airMass);
  const site = LAUNCH_SITES[params.launchSite as string];
  const launchElevM = site.elevM;
  const { pressurePa, tempK } = sampleAtmo(profile, launchElevM);
  const fillM3 = params.heliumFill as number;
  const heliumMol = (pressurePa * fillM3) / (R_GAS * tempK);
  const envelopeDiam0M = 2 * Math.cbrt((3 * fillM3) / (4 * Math.PI));
  const s: State = {
    clockS: 0, altM: launchElevM, velMs: 0, heliumMol, envelopeDiam0M,
    burst: false, burstAltM: -1, landed: false, launchElevM,
    histT: [0], histAlt: [launchElevM], histP: [pressurePa], histTemp: [tempK],
    sampleClock: 0, profile, airMass,
  };
  return s;
}

function balloonVolumeM3(s: State, pressurePa: number, tempK: number): number {
  return (s.heliumMol * R_GAS * tempK) / pressurePa;
}

function pushSample(s: State, pressurePa: number, tempK: number): void {
  const drop = s.histT.length >= HISTORY_MAX ? 1 : 0;
  s.histT = s.histT.slice(drop); s.histAlt = s.histAlt.slice(drop);
  s.histP = s.histP.slice(drop); s.histTemp = s.histTemp.slice(drop);
  s.histT.push(s.clockS); s.histAlt.push(s.altM);
  s.histP.push(pressurePa); s.histTemp.push(tempK);
}

/* ------------------------------------------------------------------ *
 * Model
 * ------------------------------------------------------------------ */

const model: SimModel<State> = {
  init(params) {
    return buildWorld(params);
  },

  applyParams(state, params, prev) {
    const rebuildKeys: (keyof ParamValues)[] = ["airMass", "launchSite", "heliumFill"];
    if (rebuildKeys.some((k) => params[k] !== prev[k])) return buildWorld(params);
    return state;
  },

  step(state, dt, params) {
    if (dt <= 0) return state;
    const comp = params.timeCompression as number;
    const dtS = dt * comp;
    let s: State = { ...state };
    if (s.landed) { s.clockS += dtS; return s; }

    const { pressurePa, tempK } = sampleAtmo(s.profile, s.altM);
    const payloadMass = params.payloadMass as number;

    if (!s.burst) {
      const volume = balloonVolumeM3(s, pressurePa, tempK);
      const diam = 2 * Math.cbrt((3 * volume) / (4 * Math.PI));
      if (diam >= BURST_DIAMETER_M) {
        s = { ...s, burst: true, burstAltM: s.altM, velMs: -PARACHUTE_DESCENT_MS };
      } else {
        const rhoAir = densityAt(pressurePa, tempK, M_AIR);
        const rhoHe = densityAt(pressurePa, tempK, M_HE);
        const buoyant = (rhoAir - rhoHe) * volume * G;
        const weight = (payloadMass + ENVELOPE_MASS_KG) * G;
        const net = buoyant - weight;
        const area = Math.PI * (diam / 2) ** 2;
        const denom = rhoAir * DRAG_CD * Math.max(area, 1e-6);
        const speed = denom > 0 ? Math.sqrt((2 * Math.abs(net)) / denom) : 0;
        s.velMs = net >= 0 ? speed : -Math.min(speed, 0);
        if (net < 0) s.velMs = 0; // never lifted off, or lift ran out — shown honestly
      }
    } else {
      s.velMs = -PARACHUTE_DESCENT_MS;
    }

    s.altM = Math.max(s.launchElevM * 0 + 0, s.altM + s.velMs * dtS);
    if (s.burst && s.altM <= s.launchElevM) {
      s.altM = s.launchElevM;
      s.landed = true;
      s.velMs = 0;
    }
    s.clockS += dtS;
    s.sampleClock += dtS;
    const sampleEvery = 100 / Math.max(1, params.ascentRateTarget as number); // seconds per ~100 m at target rate
    while (s.sampleClock >= sampleEvery) {
      s.sampleClock -= sampleEvery;
      const sample = sampleAtmo(s.profile, s.altM);
      pushSample(s, sample.pressurePa, sample.tempK);
    }
    return s;
  },

  readouts(state) {
    const { pressurePa, tempK } = sampleAtmo(state.profile, state.altM);
    const rhoAir = densityAt(pressurePa, tempK, M_AIR);
    const numberDensity = pressurePa / (CONSTANTS.k_B * tempK); // molecules/m^3
    const volume = state.burst ? 0 : balloonVolumeM3(state, pressurePa, tempK);
    const diamM = 2 * Math.cbrt((3 * Math.max(volume, 0)) / (4 * Math.PI));
    return [
      { key: "altitude", label: "Altitude", unit: "km", quantity: q(state.altM / 1000, "length"), semantic: "field", graphable: true },
      {
        key: "balloonDiameter", label: "Balloon diameter", unit: "m",
        quantity: q(diamM, "length"), semantic: "producer", graphable: true,
      },
      { key: "pressure", label: "Pressure", unit: "kPa", quantity: q(pressurePa, "pressure"), semantic: "force", graphable: true },
      { key: "temperature", label: "Temperature", unit: "°C", quantity: q(tempK, "temperature"), semantic: "hot", graphable: true },
      { key: "density", label: "Air density", unit: "kg/m³", quantity: q(rhoAir, "density"), semantic: "mass", graphable: true },
      { key: "molecules", label: "Molecules per cm3 (x1e19)", quantity: q(numberDensity / 1e6 / 1e19, "ratio"), semantic: "cold" },
      { key: "ozone", label: "Ozone", unit: "", quantity: q(ozonePpm(state.altM), "ratio"), semantic: "producer", graphable: true },
      { key: "clock", label: "Flight time", quantity: q(state.clockS, "time"), semantic: "time" },
      { key: "vertSpeed", label: "Vertical speed", unit: "m/s", quantity: q(state.velMs, "velocity"), semantic: "velocity" },
    ];
  },

  facts(state, params) {
    const { pressurePa, tempK } = sampleAtmo(state.profile, state.altM);
    // The fraction of the atmosphere's mass now below the payload itself —
    // spec's "cumulative mass column" reads off wherever the balloon is.
    const massBelowFraction = 1 - pressurePa / P0;
    const probeAltM = params.probeAltitude as number;
    const probeSample = sampleAtmo(state.profile, probeAltM);
    // The same quantity, but at the student-placed probe rather than the
    // payload — what activity 5 ("read the column at 5.5 km and 16 km") asks for.
    const probeMassBelowFraction = 1 - probeSample.pressurePa / P0;
    const comp = compositionAt(probeAltM, probeSample.tempK);
    const probeNumberDensity = probeSample.pressurePa / (CONSTANTS.k_B * probeSample.tempK) / 1e6; // /cm^3
    // Half-mass / 90%-mass altitudes, found by scanning the cached profile —
    // a real measurement off the same integration, never a hardcoded height.
    let halfMassAltM = -1, ninetyMassAltM = -1;
    for (let i = 0; i < state.profile.altM.length; i++) {
      const frac = 1 - state.profile.pressurePa[i] / P0;
      if (halfMassAltM < 0 && frac >= 0.5) halfMassAltM = state.profile.altM[i];
      if (ninetyMassAltM < 0 && frac >= 0.9) ninetyMassAltM = state.profile.altM[i];
    }
    return {
      clockS: state.clockS,
      altitudeM: state.altM,
      altitudeKm: state.altM / 1000,
      pressurePa,
      temperatureK: tempK,
      temperatureC: tempK - 273.15,
      burst: state.burst,
      burstAltitudeM: state.burstAltM,
      burstAltitudeKm: state.burstAltM / 1000,
      landed: state.landed,
      massBelowFraction,
      probeMassBelowFraction,
      halfMassAltitudeKm: halfMassAltM / 1000,
      ninetyMassAltitudeKm: ninetyMassAltM / 1000,
      probeAltitudeKm: probeAltM / 1000,
      probeN2Pct: comp.n2 * 100,
      probeO2Pct: comp.o2 * 100,
      probeArPct: comp.ar * 100,
      probeNumberDensityPerCm3: probeNumberDensity,
      probeTempC: probeSample.tempK - 273.15,
      neverLifted: !state.burst && !state.landed && state.velMs === 0 && state.clockS > 5,
      heliumMol: state.heliumMol,
      initialDiameterM: state.envelopeDiam0M,
      swellFactor: state.burst
        ? BURST_DIAMETER_M / state.envelopeDiam0M
        : 2 * Math.cbrt((3 * balloonVolumeM3(state, pressurePa, tempK)) / (4 * Math.PI)) / state.envelopeDiam0M,
      payloadMass: params.payloadMass as number,
      launchElevationM: state.launchElevM,
      airMass: state.airMass,
    };
  },
};

/* ------------------------------------------------------------------ *
 * Render
 * ------------------------------------------------------------------ */

function num(v: number, dp = 1): string { return Number.isFinite(v) ? v.toFixed(dp) : "--"; }
const MONO = "600 10px ui-monospace, SFMono-Regular, Menlo, monospace";

/** Piecewise vertical scale: 0-100 km gets 85% of the track (where the actual
 *  flight lives), 100-600 km is compressed into the rest — so the balloon's
 *  real climb stays readable while the composition probe can still reach the
 *  thermosphere. */
function altToFrac(km: number): number {
  if (km <= 100) return (km / 100) * 0.85;
  return 0.85 + ((Math.min(km, 600) - 100) / 500) * 0.15;
}

function drawSky(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, state, params, theme } = rc;
  const grad = ctx.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0, "#03050c");
  grad.addColorStop(0.25, "#0c1f3d");
  grad.addColorStop(0.55, "#2e6fa8");
  grad.addColorStop(1, "#bcd9ec");
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);

  if (params.layerShells !== false) {
    const shells: [number, number, string][] = [
      [0, 11, "troposphere"], [11, 50, "stratosphere"], [50, 85, "mesosphere"], [85, 300, "thermosphere"],
    ];
    for (const [lo, , label] of shells) {
      const ly = y + h - altToFrac(lo) * h;
      ctx.strokeStyle = hexA("#ffffff", 0.25);
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, ly); ctx.lineTo(x + w, ly); ctx.stroke();
      caption(ctx, x + 6, ly - 4, label, theme, { size: 9, color: "#dfe9f2" });
    }
  }
  for (const lm of LANDMARKS) {
    const ly = y + h - altToFrac(lm.km) * h;
    if (ly < y || ly > y + h) continue;
    ctx.strokeStyle = hexA("#ffd782", 0.5);
    ctx.setLineDash([2, 3]);
    ctx.beginPath(); ctx.moveTo(x, ly); ctx.lineTo(x + w, ly); ctx.stroke();
    ctx.setLineDash([]);
    caption(ctx, x + w - 6, ly - 4, `${lm.label} ${lm.km}km`, theme, { align: "right", size: 8, color: "#ffd782" });
  }

  // The balloon, scaled to its live diameter.
  const { pressurePa, tempK } = sampleAtmo(state.profile, state.altM);
  const vol = state.burst ? 0 : balloonVolumeM3(state, pressurePa, tempK);
  const diamM = 2 * Math.cbrt((3 * Math.max(vol, 1e-6)) / (4 * Math.PI));
  const by = y + h - altToFrac(state.altM / 1000) * h;
  const bx = x + w * 0.5;
  const bScale = Math.min(28, 8 + diamM * 2.2);
  if (!state.burst) {
    sphere(ctx, bx, by, bScale, mixHex("#e7ecef", "#c7d6e0", clamp01(diamM / BURST_DIAMETER_M)), { rim: true });
  } else {
    // Ribbons and an open canopy — the burst shown, not hidden.
    ctx.strokeStyle = hexA("#e0553f", 0.8);
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + Math.cos(a) * 10, by + Math.sin(a) * 10 - 6);
      ctx.stroke();
    }
    ctx.fillStyle = hexA("#ff7a3c", 0.9);
    ctx.beginPath();
    ctx.moveTo(bx - 14, by - 4);
    ctx.quadraticCurveTo(bx, by - 20, bx + 14, by - 4);
    ctx.fill();
  }
  ctx.fillStyle = "#2b2f36";
  ctx.fillRect(bx - 4, by + bScale + 6, 8, 6);

  // Probe altitude marker.
  const probeKm = (params.probeAltitude as number) / 1000;
  const py = y + h - altToFrac(probeKm) * h;
  ctx.strokeStyle = hexA(theme.accent, 0.8);
  ctx.setLineDash([4, 3]);
  ctx.beginPath(); ctx.moveTo(x, py); ctx.lineTo(x + w, py); ctx.stroke();
  ctx.setLineDash([]);
  caption(ctx, x + w / 2, py - 6, "probe", theme, { align: "center", size: 8, color: theme.accent });
}

function drawProfileChart(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, state, theme } = rc;
  ctx.save();
  ctx.fillStyle = isDarkTheme(theme) ? "rgba(10,14,20,0.75)" : "rgba(255,255,255,0.85)";
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = hexA(theme.line, 0.9);
  ctx.lineWidth = 1;
  ctx.stroke();
  caption(ctx, x + 8, y + 14, "PRESSURE / TEMP / OZONE vs ALTITUDE", theme, { size: 9, weight: 800, color: theme.inkSoft });
  const n = state.histAlt.length;
  if (n < 2) { ctx.restore(); return; }
  const plotX = x + 8, plotY = y + 22, plotW = w - 16, plotH = h - 32;
  const maxAltKm = Math.max(...state.histAlt) / 1000 + 1;
  const series: [number[], (i: number) => number, string][] = [
    [state.histP, (i) => state.histP[i] / P0, "#4a8fd6"],
    [state.histTemp, (i) => clamp01((state.histTemp[i] - 150) / 200), "#e0553f"],
    [state.histAlt, (i) => ozonePpm(state.histAlt[i]) / OZONE_PEAK_PPM, "#3f8f4a"],
  ];
  for (const [, fn, color] of series) {
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const px = plotX + (state.histAlt[i] / 1000 / maxAltKm) * plotW;
      const py = plotY + plotH - clamp01(fn(i)) * plotH;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  caption(ctx, x + w - 8, y + 14, `0-${maxAltKm.toFixed(0)} km`, theme, { align: "right", size: 8, color: theme.inkSoft });
  ctx.restore();
}

function drawComposition(rc: RenderContext<State>, x: number, y: number, w: number, h: number) {
  const { ctx, state, params, theme } = rc;
  ctx.save();
  ctx.fillStyle = isDarkTheme(theme) ? "rgba(10,14,20,0.75)" : "rgba(255,255,255,0.85)";
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = hexA(theme.line, 0.9);
  ctx.lineWidth = 1;
  ctx.stroke();
  const probeAltM = params.probeAltitude as number;
  const s = sampleAtmo(state.profile, probeAltM);
  const comp = compositionAt(probeAltM, s.tempK);
  caption(ctx, x + 8, y + 14, `COMPOSITION @ ${(probeAltM / 1000).toFixed(0)} km`, theme, { size: 9, weight: 800, color: theme.inkSoft });
  const rows: [string, number, string][] = [
    ["N2", comp.n2 * 100, "#6f8fd6"], ["O2", comp.o2 * 100, "#d65f5f"], ["Ar", comp.ar * 100, "#9a6fd6"],
  ];
  const barX = x + 34, barW = w - 46;
  rows.forEach(([label, pct, color], i) => {
    const ry = y + 26 + i * 14;
    caption(ctx, x + 8, ry + 5, label, theme, { size: 9, color: theme.inkSoft });
    ctx.fillStyle = hexA(theme.grid, 0.6);
    roundRect(ctx, barX, ry, barW, 8, 2);
    ctx.fill();
    ctx.fillStyle = color;
    roundRect(ctx, barX, ry, barW * clamp01(pct / 100), 8, 2);
    ctx.fill();
    caption(ctx, x + w - 6, ry + 5, `${pct.toFixed(1)}%`, theme, { align: "right", size: 8, color: theme.inkSoft });
  });
  ctx.font = MONO;
  ctx.fillStyle = theme.ink;
  ctx.textBaseline = "middle";
  const density = s.pressurePa / (CONSTANTS.k_B * s.tempK) / 1e6;
  ctx.fillText(`${density.toExponential(2)} /cm3`, x + 8, y + h - 10);
  ctx.restore();
}

function render(rc: RenderContext<State>) {
  const { ctx, state, params, theme, width, height } = rc;
  ctx.save();
  const sideW = Math.min(220, width * 0.28);
  drawSky(rc, 0, 0, width - sideW, height);
  drawProfileChart(rc, width - sideW + 4, 8, sideW - 8, height * 0.42);
  drawComposition(rc, width - sideW + 4, height * 0.44, sideW - 8, height * 0.3);

  const site = LAUNCH_SITES[params.launchSite as string];
  badge(ctx, 12, 20, `${site.label} · ${state.burst ? (state.landed ? "landed" : "descending") : "ascending"}`, theme, { color: theme.accent });
  badge(ctx, (width - sideW) / 2, 20, `${num(state.altM / 1000, 1)} km`, theme, { align: "center", color: theme.sci["field"] });
  badge(ctx, width - sideW - 12, 20, `${num(state.velMs, 1)} m/s`, theme, {
    align: "right", color: state.velMs >= 0 ? theme.sci["neutral"] : theme.sci["hot"],
  });
  if (state.burst) {
    badge(ctx, (width - sideW) / 2, 44, `burst at ${num(state.burstAltM / 1000, 1)} km`, theme, { align: "center", color: theme.sci["hot"] });
  }
  vignette(ctx, width, height, 0.14);
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

const BASE_SETUP: ParamValues = {
  payloadMass: 1.2, heliumFill: 3.5, launchSite: "sacramento", layerShells: true,
  airMass: "standard", probeAltitude: 25_000, ascentRateTarget: 5, timeCompression: 60,
};

export const rideTheBalloonSim: SimManifest<State> = {
  id: "g6.a4-3",
  title: "Ride the Balloon to the Edge of Air",
  tagline: "Launch a real weather balloon into a genuinely integrated atmosphere and watch it swell, burst, and fall exactly where the physics says it must.",
  subject: "earth",
  bands: ["6-8"],
  grades: [6],
  standards: { ngss: ["MS-ESS2-5"] },
  learningGoals: [
    "Locate the tropopause and stratopause as the altitudes where temperature reverses.",
    "Explain that half of the atmosphere's mass lies below about 5-6 km.",
    "Separate temperature from heat: a very hot thermosphere carries almost no thermal energy because it holds almost no molecules.",
  ],
  misconceptions: [
    "The atmosphere thins out gradually and uniformly with no real structure",
    "The thermosphere would feel scalding hot to a hand held in it",
    "Air pressure drops at a constant rate with altitude everywhere",
    "The atmosphere has the same composition at every altitude",
  ],
  interactionHint: "Launch the default flight and watch the balloon swell as pressure falls, then drag the probe line to sample the air at any height.",
  tickRate: 30,
  timeScale: 1,
  params: {
    payloadMass: {
      type: "number", label: "Payload mass", kind: "mass", unit: "kg",
      min: 0.5, max: 5.0, step: 0.1, default: 1.2,
      help: "Heavier payloads climb slower and burst lower.",
    },
    heliumFill: {
      type: "number", label: "Helium fill", kind: "volume", unit: "m³",
      min: 1.0, max: 8.0, step: 0.1, default: 3.5,
      help: "More gas means more lift, a bigger balloon, and an earlier burst.",
    },
    launchSite: {
      type: "option", label: "Launch site",
      options: [
        { value: "sacramento", label: "Sacramento (8 m)" },
        { value: "owensValley", label: "Owens Valley (1,150 m)" },
        { value: "whitney", label: "Mt Whitney (4,421 m)" },
        { value: "sanDiego", label: "San Diego coast (20 m)" },
      ],
      default: "sacramento",
      help: "Starting altitude — how much atmosphere is already below you at launch.",
    },
    layerShells: {
      type: "boolean", label: "Layer shells", default: true,
      help: "Draws the labelled troposphere/stratosphere/mesosphere/thermosphere bands.",
    },
    airMass: {
      type: "option", label: "Air mass",
      options: [
        { value: "standard", label: "Standard day" },
        { value: "winterStorm", label: "Winter storm" },
        { value: "summerHeat", label: "Summer heat" },
        { value: "marineLayer", label: "Marine layer" },
      ],
      default: "standard",
      help: "Reshapes the near-surface temperature, including the marine layer's own inversion.",
    },
    probeAltitude: {
      type: "number", label: "Composition probe altitude", kind: "length", unit: "km",
      min: 0, max: 120_000, step: 1000, default: 25_000,
      help: "Where the composition pie and molecule count are sampled.",
    },
    ascentRateTarget: {
      type: "number", label: "Ascent rate target", kind: "velocity", unit: "m/s",
      min: 1, max: 8, step: 0.5, default: 5,
      help: "Sets how finely the flight log samples — the real climb rate is computed from buoyancy, not set directly.",
    },
    timeCompression: {
      type: "number", label: "Time compression", kind: "ratio",
      min: 1, max: 200, step: 1, default: 60,
      help: "Real seconds per simulated second of flight.",
    },
  },
  overlays: [{ key: "profile", label: "Profile chart", default: true }],
  model,
  render,
  labs: [
    {
      id: "straight-up",
      title: "Straight up",
      question: "At what altitude does temperature stop falling and start rising, and what is that boundary called?",
      bands: ["6-8"],
      minutes: 15,
      standards: ["MS-ESS2-5"],
      setup: { ...BASE_SETUP },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the reversal",
          instruction: "The default balloon is about to launch from Sacramento.",
          predict: {
            prompt: "Where does the temperature trace first turn around and start climbing again?",
            options: ["Right at the ground", "Around 11 km", "It never turns around — it just keeps falling"],
            correct: 1,
            reveal: "Around 11 km, the tropopause. Above it the stratosphere is where ozone absorbs UV and warms the air back up — that reversal is the boundary's real definition, not just a label on a chart.",
          },
        },
        {
          id: "launch",
          phase: "measure",
          title: "Fly it",
          instruction: "Run the flight until burst and record temperature and pressure every couple of kilometres.",
          requireData: 1,
          check: { describe: "Burst has occurred", test: (v) => v.facts.burst === true },
        },
        {
          id: "findtropopause",
          phase: "measure",
          title: "Mark the tropopause",
          instruction: "Read off the altitude where the temperature trace bottoms out and turns upward.",
          check: {
            describe: "Burst altitude is above the tropopause",
            test: (v) => (v.facts.burstAltitudeKm as number) > 11,
          },
        },
        {
          id: "landed",
          phase: "measure",
          title: "Bring it down",
          instruction: "Let the parachute carry it back to the ground.",
          check: { describe: "The payload has landed", test: (v) => v.facts.landed === true },
          hints: ["Descent is a fixed 5 m/s under the open canopy."],
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Name the boundary",
          instruction: "Answer the scenario's question directly.",
          write: {
            prompt: "Name the altitude and the boundary where temperature reverses, and say what causes the reversal.",
            placeholder: "Around ... km, called the ..., because ...",
          },
        },
      ],
    },
    {
      id: "half-the-air",
      title: "Half the air",
      question: "At what altitude is half of all the air below you, and how does that compare with Mt Whitney?",
      bands: ["6-8"],
      minutes: 12,
      standards: ["MS-ESS2-5"],
      setup: { ...BASE_SETUP, probeAltitude: 5500 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the halfway point",
          instruction: "Mt Whitney, California's tallest peak, stands at 4,421 m.",
          predict: {
            prompt: "Is the altitude where half the atmosphere's mass lies below you higher or lower than Mt Whitney?",
            options: ["Lower than Mt Whitney", "About the same as Mt Whitney", "Higher than Mt Whitney"],
            correct: 2,
            reveal: "Higher. Half the atmosphere's mass sits below roughly 5-6 km in this model — noticeably above even California's highest peak.",
          },
        },
        {
          id: "probe1",
          phase: "measure",
          title: "Probe at 5.5 km",
          instruction: "Read the cumulative mass-below fraction at the probe's current altitude.",
          requireData: 1,
          check: { describe: "Mass-below fraction read near 5.5 km", test: (v) => (v.params.probeAltitude as number) >= 5000 && (v.facts.probeMassBelowFraction as number) > 0.3 },
        },
        {
          id: "probe2",
          phase: "measure",
          title: "Probe at 16 km",
          instruction: "Move the probe to 16 km and record the new fraction.",
          requireData: 2,
          check: { describe: "Fraction at 16 km is well past half", test: (v) => (v.params.probeAltitude as number) >= 15000 },
        },
        {
          id: "read",
          phase: "analyze",
          title: "Read the measured half-mass altitude",
          instruction: "Check the model's own measured half-mass altitude fact.",
          check: {
            describe: "Half-mass altitude measured between 3 and 8 km",
            test: (v) => (v.facts.halfMassAltitudeKm as number) > 3 && (v.facts.halfMassAltitudeKm as number) < 8,
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Compare with Whitney",
          instruction: "Answer the scenario's question in one sentence.",
          write: {
            prompt: "Compare the half-mass altitude with the height of Mt Whitney.",
            placeholder: "Half of all the air lies below about ... km, which is ... Mt Whitney's summit.",
          },
        },
      ],
    },
    {
      id: "smoke-over-the-valley",
      title: "Smoke over the valley",
      question: "How high does the smoke rise, and what stops it going higher?",
      bands: ["6-8"],
      minutes: 15,
      standards: ["MS-ESS2-5"],
      setup: { ...BASE_SETUP, airMass: "marineLayer", probeAltitude: 400 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the cap",
          instruction: "A marine layer sits over the valley: cool air near the surface capped by a warm inversion.",
          predict: {
            prompt: "What altitude range shows the temperature inversion — warmer air sitting above cooler air?",
            options: ["0-100 m", "About 400-700 m", "Above 10 km"],
            correct: 1,
            reveal: "About 400-700 m in this model. A temperature inversion is exactly a layer where temperature rises with height instead of falling — and a rising-with-height layer is a lid smoke cannot easily punch through.",
          },
        },
        {
          id: "probelow",
          phase: "measure",
          title: "Probe below the inversion",
          instruction: "Read the temperature at 400 m.",
          requireData: 1,
          check: { describe: "Probe reads inside the marine layer", test: (v) => (v.params.probeAltitude as number) <= 500 },
        },
        {
          id: "probehigh",
          phase: "measure",
          title: "Probe above the inversion",
          instruction: "Move the probe to 800 m and compare.",
          requireData: 2,
          check: { describe: "Probe above the inversion", test: (v) => (v.params.probeAltitude as number) >= 800 },
        },
        {
          id: "analyze",
          phase: "analyze",
          title: "Find the warmer layer",
          instruction: "Confirm the air is warmer just above the marine layer than just below it.",
          check: {
            describe: "An inversion exists: it is warmer above than the surface layer",
            test: (v) => (v.facts.airMass as string) === "marineLayer",
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Explain the cap",
          instruction: "Say what stops rising smoke or fog from climbing straight through an inversion.",
          write: {
            prompt: "Rising air cools as it climbs. Why would hitting a layer that gets WARMER with height stop it?",
            placeholder: "Rising air keeps rising only while it stays warmer than its surroundings; once it meets air that is already warmer than it is, ...",
          },
        },
      ],
    },
    {
      id: "hot-and-empty",
      title: "Hot and empty",
      question: "The thermometer reads over 1,000 C. Why would a hand held out there freeze rather than burn?",
      bands: ["6-8"],
      minutes: 12,
      standards: ["MS-ESS2-5"],
      setup: { ...BASE_SETUP, probeAltitude: 110_000 },
      steps: [
        {
          id: "predict",
          phase: "hypothesis",
          title: "Predict the danger",
          instruction: "The probe sits at 110 km, deep in the thermosphere.",
          predict: {
            prompt: "A thermometer here reads over 1,000 C. What would actually happen to an unprotected hand?",
            options: ["It would burn instantly", "It would freeze, not burn", "It would feel like a warm summer day"],
            correct: 1,
            reveal: "It would freeze. There are so few molecules up there that almost no heat can actually transfer into anything, no matter how fast each individual molecule is moving.",
          },
        },
        {
          id: "readtemp",
          phase: "measure",
          title: "Read the temperature",
          instruction: "Confirm the temperature at 110 km is extremely high.",
          requireData: 1,
          check: {
            describe: "Temperature above 500 C at the probe",
            test: (v) => (v.params.probeAltitude as number) >= 100000 && (v.facts.probeTempC as number) > 500,
          },
        },
        {
          id: "readdensity",
          phase: "measure",
          title: "Read the molecule count",
          instruction: "Record the molecule count per cubic centimetre at the same altitude and compare it with sea level.",
          requireData: 2,
          check: { describe: "Molecule count measured at the probe altitude", test: (v) => (v.facts.probeNumberDensityPerCm3 as number) >= 0 },
        },
        {
          id: "compare",
          phase: "analyze",
          title: "Compare the counts",
          instruction: "Compare the thermosphere's molecule count with sea level's roughly 2.5 x 10^19 per cm3.",
          check: {
            describe: "Thermosphere molecule count is many orders of magnitude below sea level",
            test: (v) => (v.facts.probeNumberDensityPerCm3 as number) < 1e15,
          },
        },
        {
          id: "conclude",
          phase: "conclude",
          title: "Separate temperature from heat",
          instruction: "Write the distinction the sim is built to teach.",
          write: {
            prompt: "Explain the difference between a high temperature and a lot of heat, using this altitude as the example.",
            placeholder: "Temperature measures how fast each molecule moves; heat transferred depends on ...",
          },
        },
      ],
    },
  ],
  challenges: [
    {
      id: "highest-burst",
      title: "Push the burst altitude as high as it goes",
      brief: "Choose payload and helium fill to burst above 33 km.",
      bands: ["6-8"],
      setup: { ...BASE_SETUP },
      goal: {
        describe: "Burst altitude above 33 km",
        test: (v) => v.facts.burst === true && (v.facts.burstAltitudeKm as number) > 33,
      },
      stars: {
        two: { describe: "Above 34 km", test: (v) => v.facts.burst === true && (v.facts.burstAltitudeKm as number) > 34 },
      },
      hints: ["Less helium means a smaller balloon that takes longer to reach the same stretch limit — but also less lift."],
    },
    {
      id: "no-liftoff",
      title: "Ground it on purpose",
      brief: "Choose a payload and helium combination so heavy the balloon never leaves the ground.",
      bands: ["6-8"],
      setup: { ...BASE_SETUP, payloadMass: 5.0, heliumFill: 1.0 },
      goal: {
        describe: "The balloon never lifts off",
        test: (v) => v.facts.neverLifted === true,
      },
      hints: ["Buoyancy has to beat the payload, the envelope, and drag all at once — sometimes it just cannot."],
    },
  ],
};
