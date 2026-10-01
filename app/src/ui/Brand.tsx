/**
 * The GradeNext mark, drawn rather than embedded.
 *
 * The identity is the graduation cap over the G and the purple cross in
 * "neXt". Drawing it as SVG keeps it crisp at every size, lets it inherit the
 * interface colour in dark mode, and avoids shipping a raster that would blur
 * on a projector.
 */
export function BrandMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true" focusable="false">
      {/* mortarboard */}
      <path d="M24 9 6 16l18 7 18-7z" fill="var(--brand)" />
      <path d="M13 20v7c0 3.3 4.9 6 11 6s11-2.7 11-6v-7" stroke="var(--brand)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M8 17.5v7" stroke="var(--brand)" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="8" cy="27" r="2.6" fill="var(--brand)" />
    </svg>
  );
}

export function BrandWordmark({ height = 22 }: { height?: number }) {
  return (
    <svg height={height} viewBox="0 0 132 30" fill="none" aria-label="GradeNext" role="img">
      <text
        x="0" y="14"
        fontFamily="'Bricolage Grotesque', system-ui, sans-serif"
        fontSize="15" fontWeight="800" fill="var(--ink)"
      >
        Grade
      </text>
      <text
        x="0" y="28"
        fontFamily="'Bricolage Grotesque', system-ui, sans-serif"
        fontSize="15" fontWeight="800" fill="var(--ink)"
      >
        ne
      </text>
      {/* the purple cross that replaces the x */}
      <g stroke="var(--brand)" strokeWidth="4.2" strokeLinecap="round">
        <path d="M24 21.5 34 29.5" />
        <path d="M34 21.5 24 29.5" />
      </g>
      <text
        x="36" y="28"
        fontFamily="'Bricolage Grotesque', system-ui, sans-serif"
        fontSize="15" fontWeight="800" fill="var(--ink)"
      >
        t
      </text>
    </svg>
  );
}

/** Lockup used in the app header: mark + wordmark + product name. */
export function BrandLockup() {
  return (
    <span className="brand-lockup">
      <BrandMark size={28} />
      <span className="brand-text">
        <span className="brand-name">GradeNext</span>
        <span className="brand-product">Smart Lab</span>
      </span>
    </span>
  );
}
