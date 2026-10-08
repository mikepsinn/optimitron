import { ArrowRight, ChevronDown } from "lucide-react"
import Link from "next/link"

import type { FaqQuestion } from "@/lib/faq"

const textLink = "font-medium text-primary hover:underline"

/**
 * Questions that start closed, so a reader scans them and opens the ones they care about. /faq and /act use it.
 * Each question's id is `${idPrefix}-${question.id}`, so a link can open one (see OpenFaqFromHash).
 */
export function FaqList({ questions, idPrefix }: { questions: FaqQuestion[]; idPrefix: string }) {
  return (
    <div className="divide-y rounded-lg border bg-card shadow-sm">
      {questions.map(item => (
        <details key={item.id} id={`${idPrefix}-${item.id}`} className="group scroll-mt-20">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-lg font-semibold hover:text-primary [&::-webkit-details-marker]:hidden">
            <h3>{item.question}</h3>
            <ChevronDown aria-hidden="true" className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-5 pb-5">
            {item.answer.map(paragraph => (
              <p key={paragraph.slice(0, 40)} className="mt-3 first:mt-0 text-muted-foreground">{paragraph}</p>
            ))}
            {item.source && (
              <p className="mt-3 text-sm text-muted-foreground">
                Source:{" "}
                <a href={item.source.href} rel="noreferrer" target="_blank" className={textLink}>{item.source.label}</a>
              </p>
            )}
            {item.link && (
              <p className="mt-3">
                <Link href={item.link.href} className={textLink}>
                  {item.link.label} <ArrowRight aria-hidden="true" className="inline h-4 w-4" />
                </Link>
              </p>
            )}
          </div>
        </details>
      ))}
    </div>
  )
}
