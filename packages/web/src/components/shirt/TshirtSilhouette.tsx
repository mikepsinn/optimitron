import type { ReactNode } from "react";

type TshirtSilhouetteProps = {
  children: ReactNode;
  className?: string;
  label?: string;
};

/**
 * Flat-lay crew-neck tee drawn from real garment proportions (22in chest,
 * 29.5in length, 8in set-in sleeves). The print area overlay is an exact 4:5
 * rect (186,165 228x285 in viewBox units) so the 2400x3000 artwork fits
 * without clipping.
 */
export function TshirtSilhouette({
  children,
  className,
  label,
}: TshirtSilhouetteProps) {
  const rootClassName = [
    "relative mx-auto aspect-[10/11] w-full max-w-[800px] bg-background text-foreground",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      aria-label={label}
      className={rootClassName}
      role={label ? "img" : undefined}
    >
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
        fill="none"
        viewBox="0 0 600 660"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M240 60 Q300 42 360 60 C392 64 442 76 468 91 C498 112 548 148 576 180 C562 218 532 254 494 281 C486 266 480 248 477 230 C489 300 485 480 476 592 C410 601 190 601 124 592 C115 480 111 300 123 230 C120 248 114 266 106 281 C68 254 38 218 24 180 C52 148 102 112 132 91 C158 76 208 64 240 60 Z"
          fill="#ffffff"
          stroke="#000000"
          strokeLinejoin="round"
          strokeWidth="3.5"
          vectorEffect="non-scaling-stroke"
        />
        <path d="M240 60 Q300 70 360 60 C348 124 252 124 240 60 Z" fill="#f5f5f5" />
        <path
          d="M240 60 Q300 70 360 60"
          stroke="#000000"
          strokeWidth="1.75"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M240 60 C252 124 348 124 360 60"
          stroke="#000000"
          strokeWidth="2.25"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M240 60 C250 140 350 140 360 60"
          stroke="#000000"
          strokeWidth="1.75"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M468 91 C452 130 448 190 477 230"
          stroke="#000000"
          strokeWidth="1.75"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M132 91 C148 130 152 190 123 230"
          stroke="#000000"
          strokeWidth="1.75"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M567 173 C553 211 523 247 485 274"
          stroke="#000000"
          strokeWidth="1.75"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M33 173 C47 211 77 247 115 274"
          stroke="#000000"
          strokeWidth="1.75"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M130 581 C194 589 406 589 470 581"
          stroke="#000000"
          strokeWidth="1.75"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="absolute left-[31%] top-[25%] h-[43.18%] w-[38%] overflow-hidden [&>svg]:block [&>svg]:h-auto [&>svg]:w-full">
        {children}
      </div>
    </div>
  );
}
