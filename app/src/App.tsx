import { useCallback, useEffect, useState } from "react";
import type { GradeBand } from "@engine/types";
import { getSim } from "@sims/registry";
import { Catalog } from "./pages/Catalog";
import { SimPlayer } from "./pages/SimPlayer";
import { Notebook } from "./pages/Notebook";
import { Library } from "./pages/Library";
import { applyThemeMode, effectiveTheme, loadThemeMode, type ThemeMode } from "@ui/theme";

type View =
  | { name: "catalog" }
  | { name: "sim"; id: string; band: GradeBand; query?: string }
  | { name: "notebook" }
  | { name: "library"; grade?: number };

/** Read the view out of the URL hash so every screen is linkable and shareable. */
function parseHash(): View {
  const hash = window.location.hash.replace(/^#\/?/, "");
  if (!hash) return { name: "catalog" };
  const [route, ...rest] = hash.split("/");
  if (route === "notebook") return { name: "notebook" };
  if (route === "library") {
    const g = Number(rest[0]);
    return { name: "library", grade: Number.isFinite(g) && g > 0 ? g : undefined };
  }
  if (route === "sim" && rest[0]) {
    const id = decodeURIComponent(rest[0]);
    const tail = rest[1] ?? "6-8";
    const qIndex = tail.indexOf("?");
    const band = decodeURIComponent(qIndex >= 0 ? tail.slice(0, qIndex) : tail) as GradeBand;
    const query = qIndex >= 0 ? tail.slice(qIndex + 1) : "";
    return { name: "sim", id, band, query };
  }
  return { name: "catalog" };
}

function viewToHash(view: View): string {
  if (view.name === "catalog") return "#/";
  if (view.name === "notebook") return "#/notebook";
  if (view.name === "library") return view.grade ? `#/library/${view.grade}` : "#/library";
  const q = view.query ? `?${view.query}` : "";
  return `#/sim/${encodeURIComponent(view.id)}/${encodeURIComponent(view.band)}${q}`;
}

export default function App() {
  const [view, setView] = useState<View>(() => parseHash());
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => loadThemeMode());
  const [themeKey, setThemeKey] = useState(() => effectiveTheme(loadThemeMode()));

  useEffect(() => {
    applyThemeMode(themeMode);
    setThemeKey(effectiveTheme(themeMode));
  }, [themeMode]);

  // Follow the system preference while the user has not chosen explicitly.
  useEffect(() => {
    if (themeMode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setThemeKey(effectiveTheme("system"));
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [themeMode]);

  useEffect(() => {
    const onHash = () => setView(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const navigate = useCallback((next: View) => {
    setView(next);
    const hash = viewToHash(next);
    if (window.location.hash !== hash) window.history.pushState(null, "", hash);
  }, []);

  const cycleTheme = () => {
    setThemeMode((m) => (m === "system" ? "light" : m === "light" ? "dark" : "system"));
  };

  const sim = view.name === "sim" ? getSim(view.id) : undefined;

  return (
    <div className="app">
      <button
        type="button"
        className="theme-toggle"
        onClick={cycleTheme}
        aria-label={`Theme: ${themeMode}. Click to change.`}
        title={`Theme: ${themeMode}`}
      >
        {themeMode === "system" ? "◐" : themeMode === "light" ? "☀" : "☾"}
      </button>

      {view.name === "catalog" && (
        <Catalog
          onOpen={(id, band) => navigate({ name: "sim", id, band })}
          onOpenNotebook={() => navigate({ name: "notebook" })}
          onOpenLibrary={(g?: number) => navigate({ name: "library", grade: g })}
        />
      )}

      {view.name === "library" && (
        <Library
          initialGrade={view.grade}
          onOpen={(id, band) => navigate({ name: "sim", id, band })}
          onBack={() => navigate({ name: "catalog" })}
        />
      )}

      {view.name === "notebook" && <Notebook onExit={() => navigate({ name: "catalog" })} />}

      {view.name === "sim" && sim && (
        <SimPlayer
          key={`${sim.id}:${view.query ?? ""}`}
          manifest={sim}
          band={view.band}
          shareQuery={view.query}
          onBand={(b) => navigate({ name: "sim", id: sim.id, band: b, query: view.query })}
          themeKey={themeKey}
          onExit={() => navigate({ name: "catalog" })}
        />
      )}

      {view.name === "sim" && !sim && (
        <div className="not-found">
          <h2>That simulation is not here</h2>
          <p>It may have been renamed. Head back and pick another.</p>
          <button type="button" className="btn btn-primary" onClick={() => navigate({ name: "catalog" })}>
            Back to the lab
          </button>
        </div>
      )}
    </div>
  );
}
