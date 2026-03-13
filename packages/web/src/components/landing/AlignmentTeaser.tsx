import Link from "next/link";
import { wishocracyLink } from "@/lib/routes";

const steps = [
  { number: 1, label: "Tell us what you'd spend money on" },
  { number: 2, label: "We check who actually votes that way" },
  { number: 3, label: "Find out who's been lying to you" },
];

export function AlignmentTeaser() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
          Which Politicians Actually Agree With You?
        </h2>
        <p className="mt-4 text-lg text-black/60 max-w-3xl mx-auto font-medium">
          On my planet, every official&apos;s alignment score is public and
          updated in real time. Here, you have to take their word for it. Which
          is&hellip; bold. Let&apos;s at least check the maths.
        </p>
      </div>
      <div className="max-w-xl mx-auto p-8 bg-pink-100 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="space-y-6">
          {steps.map((step) => (
            <div key={step.number} className="flex items-center gap-4">
              <div className="w-10 h-10 bg-pink-500 border-2 border-black flex items-center justify-center text-white font-black shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                {step.number}
              </div>
              <p className="text-base font-bold text-black">{step.label}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-black/50 font-medium mt-6">
          Your report gets a shareable URL. Forward it to someone who still
          thinks their favourite politician agrees with them.
        </p>
        <div className="mt-6">
          <Link
            href={wishocracyLink.href}
            className="inline-block px-8 py-3 bg-black text-white font-black uppercase border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            Start Your Alignment Report &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
