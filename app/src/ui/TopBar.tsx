import { BrandLockup } from "./Brand";
import { Icon, type IconName } from "./Icon";
import type { ThemeMode } from "./theme";

export type NavKey = "library" | "catalog" | "formulas" | "notebook";

const NAV: { key: NavKey; label: string; icon: IconName }[] = [
  { key: "library", label: "Courses", icon: "library" },
  { key: "catalog", label: "Simulations", icon: "grid" },
  { key: "formulas", label: "Formulas", icon: "spark" },
  { key: "notebook", label: "Notebook", icon: "notebook" },
];

/**
 * The persistent application bar.
 *
 * Before this, every screen was a full-page swap with no shared furniture, so
 * a student who opened a simulation had no way back except the browser and no
 * sense of where they were. One bar, always present, carrying the brand on the
 * left, the four places you can be in the middle, and settings on the right.
 */
export function TopBar(
  { active, onNavigate, themeMode, onCycleTheme }: {
    active: NavKey | "sim";
    onNavigate: (key: NavKey) => void;
    themeMode: ThemeMode;
    onCycleTheme: () => void;
  },
) {
  return (
    <header className="topbar">
      <button
        type="button"
        className="topbar-brand"
        onClick={() => onNavigate("library")}
        aria-label="GradeNext Smart Lab — home"
      >
        <BrandLockup />
      </button>

      <nav className="topbar-nav" aria-label="Main">
        {NAV.map((n) => (
          <button
            key={n.key}
            type="button"
            className={`topnav-item${active === n.key ? " is-on" : ""}`}
            aria-current={active === n.key ? "page" : undefined}
            onClick={() => onNavigate(n.key)}
          >
            <Icon name={n.icon} size={17} />
            <span>{n.label}</span>
          </button>
        ))}
      </nav>

      <div className="topbar-end">
        <button
          type="button"
          className="icon-btn"
          onClick={onCycleTheme}
          aria-label={`Theme: ${themeMode}. Activate to change.`}
          title={`Theme: ${themeMode}`}
        >
          <Icon
            name={
              themeMode === "system" ? "theme-system"
                : themeMode === "light" ? "theme-light" : "theme-dark"
            }
            size={17}
          />
        </button>
      </div>
    </header>
  );
}
