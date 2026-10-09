import { ClipboardCheck, Clock, FileText, ShieldCheck, Stethoscope, Wallet } from "lucide-react";
import { cn } from "@optimitron/neobrutalist-ui/cn";

import { Card } from "@/components/present/card";
import { threeChanges } from "@/components/present/patient-journey/opening";
import { Eyebrow, IconBadge, PatientPath, SlideFrame } from "@/components/present/slide";
import type { ScriptSlide } from "@/lib/present-script";

type Props = { s: ScriptSlide };

// What the act does, on slide 18 and the /act page.
export const actProvisions = [
  { icon: ClipboardCheck, lead: "Review:", text: "An independent board approves each treatment, clinic and consent form." },
  { icon: Stethoscope, lead: "Access:", text: "A treating doctor's documented recommendation and written consent are all a patient needs." },
  { icon: Wallet, lead: "Payment:", text: "Clinics may charge for treatment. No insurer or state program has to pay." },
  { icon: ShieldCheck, lead: "Safety:", text: "Serious side effects are reported within five days, and an unresolved safety finding stops new patients." },
  { icon: FileText, lead: "Results:", text: "Every outcome is reported in one open format and published, de-identified." },
];

export function ActSlide({ s }: Props) {
  return (
    <SlideFrame s={s}>
      <Card className="divide-y px-12">
        {actProvisions.map(provision => (
          <p key={provision.lead} className="flex items-center gap-8 py-7 text-[32px] leading-snug">
            <IconBadge icon={provision.icon} size={68} />
            <span><strong className="font-semibold">{provision.lead}</strong>{" "}
              <span className="text-muted-foreground">{provision.text}</span></span>
          </p>
        ))}
      </Card>
    </SlideFrame>
  );
}

export function CloseSlide({ s }: Props) {
  return (
    <SlideFrame s={s} tone="dark" header={false}>
      <PatientPath className="mx-auto" width={1500} />
      <h2 className="mt-14 text-[76px] font-bold leading-[1.08] tracking-tight">{s.title}</h2>
      <ul className="mt-12 space-y-7">
        {threeChanges.map(change => (
          <li key={change.lead} className="flex items-center gap-7 text-[34px] leading-snug">
            <IconBadge icon={change.icon} size={64} tone="solid" />
            <span>
              <strong className="font-semibold">{change.lead === "Any patient" ? "Any patient can get" : change.lead}</strong>{" "}
              <span className="text-muted-foreground">{closeText[change.lead]}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="absolute bottom-0 left-0 right-0 rounded-2xl border-2 border-amber-400 px-10 py-7 text-[34px]">
        Learn more at{" "}
        <strong className="font-semibold text-amber-400">acceleratedmedicine.org</strong>
      </p>
    </SlideFrame>
  );
}

const closeText: Record<string, string> = {
  "Any patient": "the most promising treatments through their own doctor.",
  "Clinics can charge for treatment,": "so they offer treatments nobody else will fund.",
  "Every result is published,": "producing treatment rankings and outcome labels.",
};

export function FrontierSlide({ s }: Props) {
  return (
    <SlideFrame s={s}>
      <p className="flex items-baseline gap-7 whitespace-nowrap text-primary">
        <span className="text-[72px] font-bold leading-none tabular-nums">9,500</span>
        <span className="text-[26px] text-muted-foreground">compounds with a human safety record</span>
        <span className="text-[60px] text-muted-foreground">×</span>
        <span className="text-[72px] font-bold leading-none tabular-nums">1,000</span>
        <span className="text-[26px] text-muted-foreground">diseases</span>
        <span className="text-[60px] text-muted-foreground">=</span>
        <span className="text-[72px] font-bold leading-none tabular-nums">9.5 million</span>
      </p>
      <div aria-hidden="true" className="mt-10 grid grid-cols-[repeat(50,1fr)] gap-[6px]">
        {Array.from({ length: 300 }, (_, i) => (
          <span key={i} className={cn("aspect-square rounded-[3px]", i === 0 ? "bg-primary" : "bg-amber-100")} />
        ))}
      </div>
      <p className="mt-6 flex flex-wrap gap-x-10 gap-y-2 text-[24px]">
        <span><span aria-hidden="true" className="mr-3 inline-block h-5 w-5 rounded-[3px] bg-primary align-middle" />Tested: about 32,500 pairs (0.34%)</span>
        <span><span aria-hidden="true" className="mr-3 inline-block h-5 w-5 rounded-[3px] bg-amber-100 align-middle" />Never tested: about 9.47 million</span>
        <span className="font-semibold"><Clock aria-hidden="true" className="mr-2 inline h-6 w-6 text-amber-500" />Over 2,000 years at today's pace</span>
      </p>
      <div className="mt-10 grid grid-cols-2 gap-10">
        <Card className="p-9">
          <h3 className="text-[30px] font-semibold">Most pairs will not work</h3>
          <p className="mt-2 text-[25px] leading-snug text-muted-foreground">If only 1 in 1,000 works, that is about 9,500 treatments nobody is looking for.</p>
        </Card>
        <Card className="p-9">
          <h3 className="text-[30px] font-semibold">What care-integrated trials change</h3>
          <p className="mt-2 text-[25px] leading-snug text-muted-foreground">
            Doctors can already use approved drugs off-label, but nobody tracks the results. Care-integrated trials add drugs
            still in testing and track every outcome.
          </p>
        </Card>
      </div>
    </SlideFrame>
  );
}

export function PossibleSlide({ s }: Props) {
  return (
    <SlideFrame s={s}>
      <p className="max-w-[1500px] text-[30px] leading-snug text-muted-foreground">
        6,650 diseases have no treatment today. At today's pace, the last of them gets its first treatment in about 443
        years. If every state adopted the act, in about 81.
      </p>
      <dl className="mt-12 space-y-8">
        {[{ label: "At today's pace", detail: "15 diseases a year", years: 443, color: "bg-slate-400" },
          { label: "If every state adopts the act", detail: "about 82 diseases a year", years: 81, color: "bg-primary" }].map(bar => (
          <div key={bar.label} className="grid grid-cols-[360px_1fr] items-center gap-8">
            <dt>
              <span className="block text-[30px] font-semibold">{bar.label}</span>
              <span className="text-[24px] text-muted-foreground">{bar.detail}</span>
            </dt>
            <dd className="flex items-center gap-6">
              <span aria-hidden="true" className={cn("h-14 rounded-lg", bar.color)} style={{ width: `${bar.years / 443 * 980}px` }} />
              <span className="whitespace-nowrap text-[44px] font-bold tabular-nums">{bar.years} years</span>
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-14 grid grid-cols-3 gap-10">
        {[{ value: "181 years", label: "sooner, on average", detail: "for a disease's first treatment" },
          { value: "44×", label: "lower cost per patient", detail: "$41,000 to under $1,000" },
          { value: "8 years", label: "less waiting after safety tests", detail: "available after board review" }].map(stat => (
          <Card key={stat.value} className="p-9">
            <p className="text-[64px] font-bold leading-none text-primary">{stat.value}</p>
            <p className="mt-4 text-[28px] font-semibold">{stat.label}</p>
            <p className="mt-1 text-[24px] text-muted-foreground">{stat.detail}</p>
          </Card>
        ))}
      </div>
    </SlideFrame>
  );
}

// Backup slide B3 uses the impact paper's global scenario on purpose, and the slide and its source line
// say so. It differs from slide B2's 50-state model, which has no patient numbers or trial spending to
// compute a research cost from. The bed-net figure ($184) is the published manual's; the
// BED_NETS_COST_PER_DALY parameter in @optimitron/data still holds an older $89.
export function ValueSlide({ s }: Props) {
  return (
    <SlideFrame s={s}>
      <Eyebrow className="text-muted-foreground">Cost per year of healthy life</Eyebrow>
      <div className="mt-8 grid grid-cols-3 gap-10">
        <Card className="border-primary bg-primary p-10 text-primary-foreground">
          <p className="text-[88px] font-bold leading-none">$9.50</p>
          <p className="mt-5 text-[32px] font-semibold">Care-integrated trials</p>
          <p className="mt-1 text-[24px] text-primary-foreground/85">at global scale, in everyday care</p>
        </Card>
        <Card className="p-10">
          <p className="text-[88px] font-bold leading-none text-amber-500">$184</p>
          <p className="mt-5 text-[32px] font-semibold">Malaria bed nets</p>
          <p className="mt-1 text-[24px] text-muted-foreground">one of the best charities known</p>
        </Card>
        <Card className="p-10">
          <p className="text-[88px] font-bold leading-none">$100,000+</p>
          <p className="mt-5 text-[32px] font-semibold">A typical new drug</p>
          <p className="mt-1 text-[24px] text-muted-foreground">at the usual U.S. price limit</p>
        </Card>
      </div>
      <dl className="mt-12 space-y-4 text-[24px]">
        {[{ label: "Care-integrated trials", note: "$9.50: too small to see at this scale", width: 0 },
          { label: "Malaria bed nets", note: "$184: about 2 pixels wide", width: 2 },
          { label: "A typical new drug", note: "$100,000+", width: 1220 }].map(row => (
          <div key={row.label} className="grid grid-cols-[320px_1fr] items-center gap-6">
            <dt className="font-semibold">{row.label}</dt>
            <dd className="flex h-11 items-center gap-4">
              {row.width > 100 ? (
                <span className="flex h-full items-center bg-slate-700 px-4 font-semibold text-white" style={{ width: row.width }}>{row.note}</span>
              ) : (
                <>{row.width > 0 && <span aria-hidden="true" className="h-full bg-amber-500" style={{ width: row.width }} />}{row.note}</>
              )}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-10 text-[30px]">About <strong>19 times</strong> cheaper than bed nets. Over <strong>10,000 times</strong> cheaper than a typical new drug.</p>
    </SlideFrame>
  );
}
