import { DATING_SAFETY_COPY } from "@/lib/dating-safety";

export function MissionSafetyNotice({ compact = false }: { compact?: boolean }) {
  return (
    <section className="border-2 border-foreground p-5">
      <h2 className="text-lg font-black uppercase">
        {DATING_SAFETY_COPY.title}
      </h2>
      <p className="mt-2 text-sm font-bold leading-relaxed text-muted-foreground">
        {DATING_SAFETY_COPY.body}
      </p>
      {!compact ? (
        <ul className="mt-4 ml-4 list-disc space-y-2 text-sm font-bold leading-relaxed text-muted-foreground">
          {DATING_SAFETY_COPY.rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
