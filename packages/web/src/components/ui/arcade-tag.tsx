interface ArcadeTagProps {
  children: React.ReactNode;
  /** Bottom margin, defaults to mb-2. */
  className?: string;
}

/**
 * Subtitle tag for page headers.
 */
export function ArcadeTag({ children, className = "mb-2" }: ArcadeTagProps) {
  return (
    <p className={`text-xs font-black uppercase text-muted-foreground ${className}`}>
      {children}
    </p>
  );
}
