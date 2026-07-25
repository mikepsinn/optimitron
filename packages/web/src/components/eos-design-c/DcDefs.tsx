/**
 * One hidden SVG carrying the defs every drawing on the page reuses:
 * the pencil-wobble displacement filter. Rendered once at the top of the page
 * so each figure stays markup-only. Arrowheads are drawn into their own
 * paths rather than referenced as markers, because markers do not survive
 * the filter.
 */
export function DcDefs() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
    >
      <defs>
        {/* Displaces strokes just enough to read as hand-drawn chalk. */}
        <filter id="dc-pencil" x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.035"
            numOctaves="3"
            seed="7"
            result="dc-noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="dc-noise"
            scale="1.25"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
