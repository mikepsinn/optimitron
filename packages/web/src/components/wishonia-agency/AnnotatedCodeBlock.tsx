interface AnnotatedCodeBlockProps {
  header: string;
  code: string;
  language: "solidity" | "typescript";
  explanation: string;
}

export function AnnotatedCodeBlock({
  header,
  code,
  language,
  explanation,
}: AnnotatedCodeBlockProps) {
  const implementationLabel = language === "solidity" ? "Protocol rules" : "System logic";

  return (
    <section className="mb-16">
      <h2 className="mb-4 text-2xl font-black uppercase tracking-tight text-foreground">
        What Replaces Them
      </h2>
      <p className="mb-6 max-w-3xl text-sm font-bold text-muted-foreground">
        {header}
      </p>
      <div className="border-y border-foreground/30 bg-background">
        <div className="flex items-center justify-between border-b border-foreground/30 py-2">
          <span className="text-xs font-black uppercase tracking-[0.1em] text-muted-foreground">
            {implementationLabel}
          </span>
          <span className="text-xs font-black uppercase tracking-[0.1em] text-muted-foreground">
            Reference implementation
          </span>
        </div>
        <pre className="overflow-x-auto py-4 text-sm font-bold leading-relaxed text-foreground">
          <code>{code}</code>
        </pre>
      </div>
      <div className="mt-4 border-l border-foreground/30 pl-4">
        <p className="text-sm font-bold leading-relaxed text-muted-foreground">
          {explanation}
        </p>
      </div>
    </section>
  );
}
