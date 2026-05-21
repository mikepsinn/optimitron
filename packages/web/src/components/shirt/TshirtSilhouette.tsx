import type { ReactNode } from "react";

type TshirtSilhouetteProps = {
  children: ReactNode;
  className?: string;
  label?: string;
};

export function TshirtSilhouette({
  children,
  className,
  label,
}: TshirtSilhouetteProps) {
  const rootClassName = [
    "relative mx-auto aspect-[6/7] w-full max-w-[800px] bg-background text-foreground",
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
        viewBox="0 0 600 700"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M210 55 L252 24 H348 L390 55 L536 112 L500 236 L430 214 L430 650 H170 L170 214 L100 236 L64 112 L210 55 Z M252 44 C260 78 340 78 348 44 H252 Z"
          fill="#ffffff"
          fillRule="evenodd"
          stroke="#000000"
          strokeLinejoin="miter"
          strokeWidth="4"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="absolute left-[16.5%] top-[22%] h-[52%] w-[67%] overflow-hidden [&>svg]:block [&>svg]:h-auto [&>svg]:w-full">
        {children}
      </div>
    </div>
  );
}
