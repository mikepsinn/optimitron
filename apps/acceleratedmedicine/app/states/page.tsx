import type { Metadata } from "next"

import { AcceleratedMedicinePage } from "@/components/accelerated-medicine-chrome"
import { StateTileMap } from "@/components/state-tile-map"
import { rightToTrialMetadata } from "@/lib/right-to-trial-metadata"

export const metadata: Metadata = rightToTrialMetadata({
  title: "Your State | Care-Integrated Clinical Trials Initiative",
  description:
    "Choose a state to see how many people there live with conditions that better treatments could help, and what the Care-Integrated Clinical Trials Act would change.",
  path: "/states",
})

export default function StatesPage() {
  return (
    <AcceleratedMedicinePage>
      <section className="mx-auto max-w-4xl pb-12 text-center md:py-8 md:pb-16">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Your state</h1>
        <p className="mx-auto mt-4 max-w-3xl text-muted-foreground md:text-xl">
          Choose a state to see how many people there live with conditions that better treatments could help, and
          what the Care-Integrated Clinical Trials Act would change.
        </p>
        <div className="mt-10">
          <StateTileMap />
        </div>
      </section>
    </AcceleratedMedicinePage>
  )
}
