import Link from "next/link";
import { misconceptionsLink } from "@/lib/routes";

interface MythCard {
  id: string;
  myth: string;
  reality: string;
  grade: string;
}

export function MythVsDataTeaser({
  findings,
  totalCount,
  failCount,
}: {
  findings: MythCard[];
  totalCount: number;
  failCount: number;
}) {
  return (
    <section className="bg-red-50 py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
            Things Everyone Believes That Are Wrong
          </h2>
          <p className="mt-4 text-lg text-black/60 max-w-3xl mx-auto font-medium">
            I tested {totalCount} of your most popular policy beliefs against
            OECD, World Bank, and federal data. {failCount} of them got an F.
            On my planet we&apos;d call this &ldquo;a problem.&rdquo; Here you
            seem to call it &ldquo;politics.&rdquo;
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {findings.map((finding) => (
            <div
              key={finding.id}
              className="p-6 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col"
            >
              <div className="flex items-start gap-3 mb-4">
                <span className="shrink-0 w-10 h-10 bg-red-500 text-white font-black text-lg flex items-center justify-center border-2 border-black">
                  {finding.grade}
                </span>
                <p className="text-sm font-black text-black leading-snug">
                  &ldquo;{finding.myth}&rdquo;
                </p>
              </div>
              <p className="text-sm text-black/60 font-medium leading-relaxed mt-auto">
                {finding.reality}
              </p>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link
            href={misconceptionsLink.href}
            className="inline-flex items-center text-sm font-black text-red-600 hover:text-red-800 uppercase transition-colors"
          >
            See All {totalCount} Findings (brace yourself) &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
