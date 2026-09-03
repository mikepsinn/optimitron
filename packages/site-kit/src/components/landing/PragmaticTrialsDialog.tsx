import type { ReactNode } from "react"
import { ParameterInline } from "../shared/ParameterValue"
import { Button } from "@optimitron/neobrutalist-ui/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@optimitron/neobrutalist-ui/ui/dialog"
import {
  DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT,
  RECOVERY_TRIAL_COST_REDUCTION_FACTOR,
  TRADITIONAL_PHASE3_COST_PER_PATIENT,
} from "@optimitron/data/parameters"

interface PragmaticTrialsDialogProps {
  children: ReactNode
  triggerClassName?: string
}

export function PragmaticTrialsDialog({
  children,
  triggerClassName,
}: PragmaticTrialsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className={triggerClassName}>
          {children}
        </button>
      </DialogTrigger>
      <DialogContent
        className="!inset-0 !h-[100dvh] !w-screen !max-w-none !translate-x-0 !translate-y-0 gap-0 overflow-y-auto overscroll-y-contain border-0 p-0 shadow-none sm:rounded-none"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="min-h-full bg-background">
          <div className="sticky top-0 z-10 border-b-4 border-primary bg-brutal-cyan px-5 py-5 sm:px-8 sm:py-6">
            <div className="mx-auto max-w-6xl pr-14">
              <DialogHeader className="space-y-2 text-left">
                <DialogTitle className="text-2xl font-black uppercase sm:text-3xl">
                  What Are Pragmatic Clinical Trials?
                </DialogTitle>
                <DialogDescription className="text-sm font-bold text-foreground/80 sm:text-base">
                  Trials embedded in routine care that compare treatments in real patients using existing clinical
                  data, so the evidence improves while patients keep getting treated.
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>

          <div className="mx-auto max-w-6xl space-y-6 p-5 pb-8 sm:p-8">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="border-4 border-primary bg-brutal-yellow p-4">
                <div className="text-xs font-black uppercase">Pragmatic Cost</div>
                <div className="mt-2 text-2xl font-black">
                  <ParameterInline param={DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT} />
                </div>
                <div className="mt-1 text-sm font-bold">per patient</div>
              </div>
              <div className="border-4 border-primary bg-brutal-pink p-4 text-brutal-pink-foreground">
                <div className="text-xs font-black uppercase">Traditional Phase 3</div>
                <div className="mt-2 text-2xl font-black">
                  <ParameterInline param={TRADITIONAL_PHASE3_COST_PER_PATIENT} />
                </div>
                <div className="mt-1 text-sm font-bold">per patient</div>
              </div>
              <div className="border-4 border-primary bg-brutal-green p-4">
                <div className="text-xs font-black uppercase">Cost Efficiency</div>
                <div className="mt-2 text-2xl font-black">
                  <ParameterInline param={RECOVERY_TRIAL_COST_REDUCTION_FACTOR} />
                </div>
                <div className="mt-1 text-sm font-bold">cheaper in the RECOVERY model</div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="border-4 border-primary bg-background p-5">
                <h3 className="text-lg font-black uppercase">How They Work</h3>
                <p className="mt-3 font-bold leading-relaxed text-muted-foreground">
                  Patients stay in normal care. Doctors use the existing health system. Outcomes come from clinical
                  records instead of a parallel paperwork machine. That makes recruitment broader, costs lower, and
                  the evidence more representative of real life.
                </p>
              </div>
              <div className="border-4 border-primary bg-background p-5">
                <h3 className="text-lg font-black uppercase">What The Goal Is</h3>
                <p className="mt-3 font-bold leading-relaxed text-muted-foreground">
                  Build a global ranked list of the safest and most effective treatments for each condition using all
                  available clinical-trial and real-world data, and keep patients on the best-supported treatment as
                  the ranking updates.
                </p>
              </div>
            </div>

            <div className="border-4 border-primary bg-brutal-cyan p-5">
              <h3 className="text-lg font-black uppercase">What Patients Get</h3>
              <p className="mt-3 font-bold leading-relaxed">
                Patients should always have access to the most effective treatment the evidence supports. When the
                best answer is still uncertain after safety testing, they should be able to enter pragmatic trials so
                treatment access and evidence generation happen at the same time instead of years apart.
              </p>
            </div>

            <DialogClose asChild>
              <Button className="h-12 w-full text-base font-black uppercase">Close</Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
