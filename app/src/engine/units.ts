/**
 * Units and uncertainty as a first-class concern.
 *
 * The specification flags this as time-critical: retrofitting units across 160+
 * simulations is painful, so every physical value carries its unit and an
 * optional uncertainty from the very first sim.
 *
 * Values are stored in SI base units internally; display conversion happens at
 * the edge, so model code never has to think about whether a student is looking
 * at centimetres or metres.
 */

export type UnitKind =
  | "length" | "time" | "mass" | "velocity" | "acceleration" | "force"
  | "energy" | "power" | "temperature" | "charge" | "current" | "voltage"
  | "resistance" | "angle" | "frequency" | "pressure" | "area" | "volume"
  | "density" | "amount" | "concentration" | "ph" | "count" | "ratio"
  | "percent" | "wavelength" | "magneticField" | "population" | "money";

export interface UnitDef {
  /** Symbol shown next to a number, e.g. "m/s". Empty for dimensionless. */
  symbol: string;
  /** Human name, used by the screen-reader narrator. */
  name: string;
  /** Multiply an SI value by this to get the display value. */
  factor: number;
  /** Added after scaling (only temperature needs this). */
  offset?: number;
}

/** The display unit registry, keyed by unit kind then unit id. */
export const UNITS: Record<UnitKind, Record<string, UnitDef>> = {
  length: {
    m: { symbol: "m", name: "meters", factor: 1 },
    cm: { symbol: "cm", name: "centimeters", factor: 100 },
    mm: { symbol: "mm", name: "millimeters", factor: 1000 },
    km: { symbol: "km", name: "kilometers", factor: 0.001 },
    au: { symbol: "AU", name: "astronomical units", factor: 1 / 1.495978707e11 },
    nm: { symbol: "nm", name: "nanometers", factor: 1e9 },
  },
  time: {
    s: { symbol: "s", name: "seconds", factor: 1 },
    ms: { symbol: "ms", name: "milliseconds", factor: 1000 },
    min: { symbol: "min", name: "minutes", factor: 1 / 60 },
    h: { symbol: "h", name: "hours", factor: 1 / 3600 },
    d: { symbol: "d", name: "days", factor: 1 / 86400 },
    yr: { symbol: "yr", name: "years", factor: 1 / 31557600 },
  },
  mass: {
    kg: { symbol: "kg", name: "kilograms", factor: 1 },
    g: { symbol: "g", name: "grams", factor: 1000 },
    t: { symbol: "t", name: "tonnes", factor: 0.001 },
  },
  velocity: {
    "m/s": { symbol: "m/s", name: "meters per second", factor: 1 },
    "km/h": { symbol: "km/h", name: "kilometers per hour", factor: 3.6 },
  },
  acceleration: { "m/s²": { symbol: "m/s²", name: "meters per second squared", factor: 1 } },
  force: {
    N: { symbol: "N", name: "newtons", factor: 1 },
    kN: { symbol: "kN", name: "kilonewtons", factor: 0.001 },
  },
  energy: {
    J: { symbol: "J", name: "joules", factor: 1 },
    kJ: { symbol: "kJ", name: "kilojoules", factor: 0.001 },
    cal: { symbol: "cal", name: "calories", factor: 1 / 4.184 },
    eV: { symbol: "eV", name: "electronvolts", factor: 1 / 1.602176634e-19 },
  },
  power: { W: { symbol: "W", name: "watts", factor: 1 }, kW: { symbol: "kW", name: "kilowatts", factor: 0.001 } },
  temperature: {
    K: { symbol: "K", name: "kelvin", factor: 1 },
    "°C": { symbol: "°C", name: "degrees Celsius", factor: 1, offset: -273.15 },
    "°F": { symbol: "°F", name: "degrees Fahrenheit", factor: 1.8, offset: -459.67 },
  },
  charge: { C: { symbol: "C", name: "coulombs", factor: 1 }, e: { symbol: "e", name: "elementary charges", factor: 1 / 1.602176634e-19 } },
  current: { A: { symbol: "A", name: "amperes", factor: 1 }, mA: { symbol: "mA", name: "milliamperes", factor: 1000 } },
  voltage: { V: { symbol: "V", name: "volts", factor: 1 }, mV: { symbol: "mV", name: "millivolts", factor: 1000 } },
  resistance: { "Ω": { symbol: "Ω", name: "ohms", factor: 1 }, "kΩ": { symbol: "kΩ", name: "kilohms", factor: 0.001 } },
  angle: {
    rad: { symbol: "rad", name: "radians", factor: 1 },
    "°": { symbol: "°", name: "degrees", factor: 180 / Math.PI },
  },
  frequency: { Hz: { symbol: "Hz", name: "hertz", factor: 1 }, kHz: { symbol: "kHz", name: "kilohertz", factor: 0.001 } },
  pressure: { Pa: { symbol: "Pa", name: "pascals", factor: 1 }, kPa: { symbol: "kPa", name: "kilopascals", factor: 0.001 }, atm: { symbol: "atm", name: "atmospheres", factor: 1 / 101325 } },
  area: { "m²": { symbol: "m²", name: "square meters", factor: 1 }, "cm²": { symbol: "cm²", name: "square centimeters", factor: 1e4 } },
  volume: { "m³": { symbol: "m³", name: "cubic meters", factor: 1 }, L: { symbol: "L", name: "liters", factor: 1000 }, mL: { symbol: "mL", name: "milliliters", factor: 1e6 } },
  density: { "kg/m³": { symbol: "kg/m³", name: "kilograms per cubic meter", factor: 1 }, "g/cm³": { symbol: "g/cm³", name: "grams per cubic centimeter", factor: 0.001 } },
  amount: { mol: { symbol: "mol", name: "moles", factor: 1 } },
  concentration: { M: { symbol: "M", name: "molar", factor: 1 } },
  ph: { pH: { symbol: "pH", name: "pH", factor: 1 } },
  count: { "": { symbol: "", name: "", factor: 1 } },
  ratio: { "": { symbol: "", name: "", factor: 1 } },
  percent: { "%": { symbol: "%", name: "percent", factor: 100 } },
  wavelength: { nm: { symbol: "nm", name: "nanometers", factor: 1e9 }, m: { symbol: "m", name: "meters", factor: 1 } },
  magneticField: { T: { symbol: "T", name: "tesla", factor: 1 }, mT: { symbol: "mT", name: "millitesla", factor: 1000 } },
  population: { "": { symbol: "", name: "individuals", factor: 1 } },
  money: { $: { symbol: "$", name: "dollars", factor: 1 } },
};

/** A physical quantity: an SI magnitude, its kind, and optional uncertainty. */
export interface Quantity {
  value: number;
  kind: UnitKind;
  /** Absolute uncertainty in SI units (±). Undefined means "exact". */
  uncertainty?: number;
}

export function q(value: number, kind: UnitKind, uncertainty?: number): Quantity {
  return uncertainty === undefined ? { value, kind } : { value, kind, uncertainty };
}

export function convert(siValue: number, kind: UnitKind, unitId: string): number {
  const def = UNITS[kind]?.[unitId];
  if (!def) return siValue;
  return siValue * def.factor + (def.offset ?? 0);
}

export function toSI(displayValue: number, kind: UnitKind, unitId: string): number {
  const def = UNITS[kind]?.[unitId];
  if (!def) return displayValue;
  return (displayValue - (def.offset ?? 0)) / def.factor;
}

export function unitSymbol(kind: UnitKind, unitId: string): string {
  return UNITS[kind]?.[unitId]?.symbol ?? "";
}

export function unitName(kind: UnitKind, unitId: string): string {
  return UNITS[kind]?.[unitId]?.name ?? "";
}

/**
 * Significant-figure formatting appropriate to a grade band. Younger students
 * see rounder numbers; older students see the precision the measurement earns.
 */
export function formatValue(value: number, sigFigs: number): string {
  if (!Number.isFinite(value)) return "—";
  if (value === 0) return "0";
  const abs = Math.abs(value);
  if (abs >= 1e6 || abs < 1e-4) {
    return value.toExponential(Math.max(0, sigFigs - 1));
  }
  const magnitude = Math.floor(Math.log10(abs));
  const decimals = Math.max(0, Math.min(10, sigFigs - 1 - magnitude));
  return value.toFixed(decimals);
}

export interface FormatOptions {
  unitId?: string;
  sigFigs?: number;
  /** Show "± u" when the quantity carries uncertainty. */
  showUncertainty?: boolean;
  /** Omit the unit symbol (for compact table cells that head their own column). */
  bare?: boolean;
}

/** Format a quantity for display, converting out of SI as needed. */
export function format(quantity: Quantity, opts: FormatOptions = {}): string {
  const kindUnits = UNITS[quantity.kind] ?? {};
  const unitId = opts.unitId ?? Object.keys(kindUnits)[0] ?? "";
  const sigFigs = opts.sigFigs ?? 3;
  const shown = convert(quantity.value, quantity.kind, unitId);
  let text = formatValue(shown, sigFigs);

  if (opts.showUncertainty && quantity.uncertainty !== undefined) {
    const def = kindUnits[unitId];
    // Uncertainty scales but never takes the offset — it is an interval width.
    const shownU = quantity.uncertainty * (def?.factor ?? 1);
    text += ` ± ${formatValue(shownU, 2)}`;
  }
  const symbol = unitSymbol(quantity.kind, unitId);
  return opts.bare || !symbol ? text : `${text} ${symbol}`;
}

/** Relative uncertainty, useful for propagation and for HS error discussion. */
export function relativeUncertainty(quantity: Quantity): number {
  if (!quantity.uncertainty || quantity.value === 0) return 0;
  return Math.abs(quantity.uncertainty / quantity.value);
}

/** Propagate uncertainty through a product or quotient (quadrature sum). */
export function propagateProduct(value: number, kind: UnitKind, ...inputs: Quantity[]): Quantity {
  const rel = Math.sqrt(inputs.reduce((sum, i) => sum + relativeUncertainty(i) ** 2, 0));
  return rel > 0 ? q(value, kind, Math.abs(value) * rel) : q(value, kind);
}

/** Propagate uncertainty through a sum or difference (quadrature sum). */
export function propagateSum(value: number, kind: UnitKind, ...inputs: Quantity[]): Quantity {
  const abs = Math.sqrt(inputs.reduce((sum, i) => sum + (i.uncertainty ?? 0) ** 2, 0));
  return abs > 0 ? q(value, kind, abs) : q(value, kind);
}

/** Physical constants, in SI, shared by every simulation. */
export const CONSTANTS = {
  g: 9.80665,               // standard gravity, m/s²
  G: 6.6743e-11,            // gravitational constant, N·m²/kg²
  c: 299792458,             // speed of light, m/s
  e: 1.602176634e-19,       // elementary charge, C
  k_e: 8.9875517873681764e9,// Coulomb constant, N·m²/C²
  h: 6.62607015e-34,        // Planck constant, J·s
  k_B: 1.380649e-23,        // Boltzmann constant, J/K
  N_A: 6.02214076e23,       // Avogadro constant, /mol
  R: 8.31446261815324,      // gas constant, J/(mol·K)
  sigma: 5.670374419e-8,    // Stefan-Boltzmann, W/(m²·K⁴)
  atm: 101325,              // standard atmosphere, Pa
  earthMass: 5.9722e24,     // kg
  earthRadius: 6.371e6,     // m
  sunMass: 1.98892e30,      // kg
  au: 1.495978707e11,       // m
} as const;
