/**
 * The GradeNext Smart Lab icon set.
 *
 * Emoji were replaced with these because emoji render differently on every
 * operating system, carry a cartoon tone that undercuts a science platform,
 * and cannot inherit colour or weight from the interface around them. These
 * are drawn on a 24-unit grid with a 1.75 stroke, inherit `currentColor`, and
 * scale cleanly from a 14px inline mark to a 40px feature icon.
 */

export type IconName =
  | "explore" | "lab" | "challenge" | "library" | "notebook"
  | "ruler" | "protractor" | "stopwatch" | "thermometer" | "scale"
  | "graph" | "table" | "camera" | "share" | "record"
  | "play" | "pause" | "step" | "reset"
  | "chevron-right" | "chevron-left" | "chevron-down" | "arrow-left"
  | "theme-system" | "theme-light" | "theme-dark"
  | "search" | "check" | "close" | "info" | "spark" | "grid" | "target";

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  /** Decorative by default; pass a label to expose it to screen readers. */
  label?: string;
}

const P: Record<IconName, React.ReactNode> = {
  /* --- modes ------------------------------------------------------- */
  explore: <><circle cx="12" cy="12" r="9" /><path d="m15.2 8.8-2 4.4-4.4 2 2-4.4z" /></>,
  lab: <><path d="M9 3h6M10 3v5.2L5.6 17A2 2 0 0 0 7.4 20h9.2a2 2 0 0 0 1.8-2.8L14 8.2V3" /><path d="M8.2 14h7.6" /></>,
  challenge: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" /></>,
  library: <><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H10a2 2 0 0 1 2 2v13a2 2 0 0 0-2-1.6H5.5A1.5 1.5 0 0 1 4 16V5.5Z" /><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H14a2 2 0 0 0-2 2v13a2 2 0 0 1 2-1.6h4.5A1.5 1.5 0 0 0 20 16V5.5Z" /></>,
  notebook: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 3v18M12 8h4M12 12h4" /></>,

  /* --- instruments -------------------------------------------------- */
  ruler: <><rect x="2.5" y="8.5" width="19" height="7" rx="1" transform="rotate(-12 12 12)" /><path d="M6.6 9.6v2.2M9.7 8.9v3.2M12.8 8.2v2.2M15.9 7.5v3.2M19 6.8v2.2" /></>,
  protractor: <><path d="M3.5 17.5a8.5 8.5 0 0 1 17 0Z" /><path d="M12 17.5V15M7.6 17.5l1.6-1.8M16.4 17.5l-1.6-1.8" /></>,
  stopwatch: <><circle cx="12" cy="13.5" r="7.5" /><path d="M12 9.5v4l2.4 1.6M9.5 2.5h5M12 2.5V6" /></>,
  thermometer: <><path d="M14 14.8V5.5a2 2 0 1 0-4 0v9.3a4 4 0 1 0 4 0Z" /><circle cx="12" cy="17.5" r="1.6" /></>,
  scale: <><path d="M12 4v16M5 20h14M5 8h14M8.5 8 5.5 14h6ZM15.5 8l-3 6h6Z" /></>,

  /* --- data --------------------------------------------------------- */
  graph: <><path d="M4 4v16h16" /><path d="M7.5 15.5 11 11l3 2.6 4-6" /></>,
  table: <><rect x="3.5" y="4.5" width="17" height="15" rx="1.5" /><path d="M3.5 9.5h17M9.5 9.5v10M15 9.5v10" /></>,
  camera: <><path d="M3.5 8.5A1.5 1.5 0 0 1 5 7h2.2l1.3-2h7l1.3 2H19a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5Z" /><circle cx="12" cy="12.8" r="3.3" /></>,
  share: <><circle cx="6.5" cy="12" r="2.5" /><circle cx="17.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /><path d="m8.8 10.8 6.4-3.2M8.8 13.2l6.4 3.2" /></>,
  record: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="3.5" fill="currentColor" stroke="none" /></>,

  /* --- transport ---------------------------------------------------- */
  play: <path d="M8 5.4v13.2l10-6.6z" fill="currentColor" stroke="none" />,
  pause: <><rect x="7.5" y="5.5" width="3.4" height="13" rx="1" fill="currentColor" stroke="none" /><rect x="13.1" y="5.5" width="3.4" height="13" rx="1" fill="currentColor" stroke="none" /></>,
  step: <><path d="M6 5.4v13.2l9-6.6z" fill="currentColor" stroke="none" /><path d="M18 5.4v13.2" /></>,
  reset: <><path d="M4.5 12a7.5 7.5 0 1 0 2.4-5.5" /><path d="M4 4.5V10h5.5" /></>,

  /* --- navigation --------------------------------------------------- */
  "chevron-right": <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />,
  "chevron-left": <path d="m14.5 5.5-6.5 6.5 6.5 6.5" />,
  "chevron-down": <path d="m5.5 9.5 6.5 6.5 6.5-6.5" />,
  "arrow-left": <><path d="M19 12H5" /><path d="m11 6-6 6 6 6" /></>,

  /* --- theme -------------------------------------------------------- */
  "theme-system": <><circle cx="12" cy="12" r="8.5" /><path d="M12 3.5v17a8.5 8.5 0 0 0 0-17Z" fill="currentColor" stroke="none" /></>,
  "theme-light": <><circle cx="12" cy="12" r="4.2" /><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7" /></>,
  "theme-dark": <path d="M20 14.2A8.4 8.4 0 0 1 9.8 4 8.5 8.5 0 1 0 20 14.2Z" />,

  /* --- misc --------------------------------------------------------- */
  search: <><circle cx="10.8" cy="10.8" r="6.3" /><path d="m15.6 15.6 4 4" /></>,
  check: <path d="m5 12.5 4.6 4.5L19 7.5" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5.5M12 7.8v.5" /></>,
  spark: <path d="M12 3.5 13.9 9l5.6 1.9-5.6 1.9L12 20.5l-1.9-5.7-5.6-1.9L10.1 9z" />,
  grid: <><rect x="4" y="4" width="7" height="7" rx="1" /><rect x="13" y="4" width="7" height="7" rx="1" /><rect x="4" y="13" width="7" height="7" rx="1" /><rect x="13" y="13" width="7" height="7" rx="1" /></>,
  target: <><circle cx="12" cy="12" r="8.5" /><path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3" /></>,
};

export function Icon({ name, size = 18, className, label }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {P[name]}
    </svg>
  );
}
