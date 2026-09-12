/**
 * The Formula Lab.
 *
 * Every formula a Grade 6-8 student meets, in one place, tied to the topic
 * that introduces it. A formula on its own is a string to memorise; a formula
 * next to the quantity it predicts, with the units spelled out and a worked
 * example a student can change, is a tool. Each entry therefore carries what
 * each symbol means, the units, a worked example, and the simulation where
 * the student can watch it behave.
 */

export interface Symbol {
  /** The symbol as written, e.g. "v". */
  sym: string;
  /** What it stands for, e.g. "speed". */
  means: string;
  /** SI unit shown to students, e.g. "m/s". */
  unit?: string;
}

export interface WorkedExample {
  /** The situation in one sentence. */
  setup: string;
  /** Substituted form, e.g. "v = 120 m ÷ 15 s". */
  working: string;
  /** The answer with its unit, e.g. "8 m/s". */
  answer: string;
}

export interface Formula {
  id: string;
  /** The relationship in words — always leads, because the words are the idea. */
  name: string;
  /** The formula itself, in plain text with unicode maths. */
  expression: string;
  /** Rearrangements a student is expected to be able to use. */
  rearranged?: string[];
  symbols: Symbol[];
  /** Grades that meet this formula. */
  grades: number[];
  /** Curriculum topic codes, e.g. "G8·A1". */
  topics: string[];
  subject: "physics" | "chemistry" | "biology" | "earth" | "math";
  example?: WorkedExample;
  /** Simulation ids where this formula can be watched working. */
  sims?: string[];
  /** A caution a teacher would add — the classic misuse. */
  note?: string;
}

export interface FormulaGroup {
  id: string;
  title: string;
  /** One line on what ties these together. */
  blurb: string;
  subject: Formula["subject"];
  formulas: Formula[];
}
