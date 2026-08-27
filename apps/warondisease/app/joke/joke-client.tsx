"use client";

export function JokePrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="border border-foreground bg-foreground px-4 py-2 text-sm font-black uppercase text-background transition-colors hover:bg-background hover:text-foreground"
      onClick={() => window.print()}
    >
      {label}
    </button>
  );
}
