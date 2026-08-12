"use client"

import { motion } from "framer-motion"
import { Container } from "@optimitron/neobrutalist-ui/ui/container"
import { SectionContainer } from "@optimitron/neobrutalist-ui/ui/section-container"

export default function ProblemStatement() {
  return (
    <SectionContainer id="problem-statement" bgColor="foreground" borderPosition="bottom" padding="lg">
      <Container>
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black uppercase mb-0"
          >
            2 BILLION PEOPLE ARE
          </motion.h2>
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black uppercase text-brutal-pink mb-0"
          >
            {" "}
            SUFFERING{" "}
          </motion.h2>
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.8 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black uppercase mb-0"
          >
            FROM CURABLE DISEASES
          </motion.h2>
          <motion.h3
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 1.2 }}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase mt-8"
          >
            FOR 2 REASONS:
          </motion.h3>
        </div>
      </Container>
    </SectionContainer>
  )
}
