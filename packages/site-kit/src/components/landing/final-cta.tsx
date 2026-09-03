"use client"

import { motion } from "framer-motion"
import { Button } from "@optimitron/neobrutalist-ui/ui/button"
import { Container } from "@optimitron/neobrutalist-ui/ui/container"
import { SectionContainer } from "@optimitron/neobrutalist-ui/ui/section-container"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { VoteOrShareButton } from "../shared/VoteOrShareButton"
import { ROUTES } from '../../lib/routes'
import { isDonateLinkVisible } from "../../lib/site-config"

interface FinalCTAProps {
  showDonateButton?: boolean
}

export default function FinalCTA({ showDonateButton = true }: FinalCTAProps) {
  const donateEnabled = showDonateButton && isDonateLinkVisible()

  const statements = [
    { text: "SUFFERING: OPTIONAL", color: "" },
    { text: "SOLUTION: PROVEN", color: "" },
    { text: "COST: 1% OF MURDER BUDGET", color: "" },
    { text: "ACTION: REQUIRED", color: "" },
    { text: "TIME: NOW", color: "text-brutal-pink" }
  ]

  return (
    <SectionContainer bgColor="yellow" borderPosition="none" padding="lg" className="overflow-hidden">
      <Container size="md" className="text-center overflow-hidden">
        <div className="space-y-4 mb-12">
          {statements.map((statement, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0.5, opacity: 0 }}
              whileInView={{
                scale: [0.5, 1.2, 1],
                opacity: 1
              }}
              viewport={{ once: true }}
              transition={{
                duration: 0.4,
                ease: [0.34, 1.56, 0.64, 1],
                delay: 0.1 + index * 0.08,
                times: [0, 0.6, 1]
              }}
              className={`text-xl sm:text-2xl md:text-3xl font-black uppercase ${statement.color}`}
            >
              {statement.text}
            </motion.div>
          ))}
        </div>
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{
            duration: 0.6,
            ease: [0.34, 1.56, 0.64, 1],
            delay: 0.5
          }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          {donateEnabled && (
            <Link href={ROUTES.donate}>
              <Button className="bg-brutal-pink text-brutal-pink-foreground border-4 border-primary hover:bg-primary hover:text-primary-foreground font-black uppercase text-lg px-8 py-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                DONATE NOW
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          )}
          <VoteOrShareButton
            variant="default"
            size="lg"
            className="px-8 py-6"
          />
        </motion.div>
        {/* <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 1.5 }}
          className="mt-12 font-bold uppercase text-sm"
        >
          501(c)(3) TAX ID: 88-######
        </motion.div> */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1], delay: 0.8 }}
          className="mt-4 text-lg sm:text-xl md:text-2xl font-black uppercase"
        >
          MAKING SUFFERING OPTIONAL THROUGH MATH
        </motion.div>
      </Container>
    </SectionContainer>
  )
}
