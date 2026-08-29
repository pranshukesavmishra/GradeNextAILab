import type { FormulaGroup } from "./types";

export * from "./types";

/**
 * The formula catalogue.
 *
 * Populated from the Grade 6-8 curriculum; the Formula Lab page renders
 * whatever is here, so an empty list degrades to an honest empty state
 * rather than a broken screen.
 */
export const FORMULA_GROUPS: FormulaGroup[] = [];
