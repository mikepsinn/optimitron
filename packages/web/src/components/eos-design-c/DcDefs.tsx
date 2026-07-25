/**
 * One hidden SVG carrying the defs every drawing on the page reuses:
 * the pencil-wobble displacement filter and the arrowhead marker. Rendered
 * once at the top of the page so each figure stays markup-only.
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
            scale="1.8"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        <marker
          id="dc-head"
          markerWidth="9"
          markerHeight="9"
          refX="7"
          refY="4.5"
          orient="auto"
        >
          <path d="M0.5 0.8 L8 4.5 L0.5 8.2" fill="none" stroke="#1d1a14" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
      </defs>
    </svg>
  );
}
