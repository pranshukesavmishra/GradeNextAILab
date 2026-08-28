import type { DataRow, GradeBand, ParamValues } from "@engine/types";

/**
 * The Lab Notebook.
 *
 * Every saved experiment keeps the student's own parameters, their recorded
 * data, and what they wrote — so a report is evidence of their run, not
 * something copyable from a classmate. Stored locally for now; the backend
 * sync protocol is specified in docs/TECHNICAL_SPEC.md.
 */

export interface NotebookEntry {
  id: string;
  simId: string;
  simTitle: string;
  labTitle?: string;
  band: GradeBand;
  when: number;
  params: ParamValues;
  data: DataRow[];
  writings: Record<string, string>;
}

const KEY = "gnlab.notebook.v1";

export function loadNotebook(): NotebookEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as NotebookEntry[]) : [];
  } catch {
    // Corrupt or blocked storage should never break the lab.
    return [];
  }
}

function persist(entries: NotebookEntry[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries.slice(0, 200)));
  } catch {
    // Out of quota or private mode — the session still works, it just won't persist.
  }
}

export function addNotebookEntry(entry: Omit<NotebookEntry, "id">): NotebookEntry {
  const full: NotebookEntry = { ...entry, id: `nb_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}` };
  const entries = [full, ...loadNotebook()];
  persist(entries);
  window.dispatchEvent(new CustomEvent("gnlab:notebook"));
  return full;
}

export function deleteNotebookEntry(id: string): void {
  persist(loadNotebook().filter((e) => e.id !== id));
  window.dispatchEvent(new CustomEvent("gnlab:notebook"));
}

export function clearNotebook(): void {
  persist([]);
  window.dispatchEvent(new CustomEvent("gnlab:notebook"));
}
