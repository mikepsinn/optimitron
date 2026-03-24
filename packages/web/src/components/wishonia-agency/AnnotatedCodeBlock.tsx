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
  return (
    <section className="mb-16">
      <h2 className="mb-4 text-2xl font-black uppercase tracking-tight text-foreground">
        What Replaces Them
      </h2>
      <p className="mb-6 max-w-3xl text-sm font-bold text-muted-foreground">
        {header}
      </p>
      <div className="border-4 border-primary bg-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center justify-between border-b-4 border-primary px-4 py-2">
          <span className="text-xs font-black uppercase tracking-[0.1em] text-muted-foreground">
            {language === "solidity" ? "Solidity 0.8.24" : "TypeScript"}
          </span>
          <span className="text-xs font-black uppercase tracking-[0.1em] text-brutal-cyan">
            Deployed on Base Sepolia
          </span>
        </div>
        <pre className="overflow-x-auto p-6 text-sm font-bold leading-relaxed text-background">
          <code>{code}</code>
        </pre>
      </div>
      <div className="mt-4 border-4 border-primary bg-brutal-yellow p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <p className="text-sm font-bold leading-relaxed text-foreground">
          {explanation}
        </p>
      </div>
    </section>
  );
}
