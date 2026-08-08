"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { SectionContainer } from "@/components/ui/section-container"
import { Building2, Microscope, GraduationCap, FlaskConical, Globe } from "lucide-react"
import { InstituteShowcaseCard } from "./InstituteShowcaseCard"

const categories = [
  { name: "ALL", icon: Globe },
  { name: "UNIVERSITIES", icon: GraduationCap },
  { name: "RESEARCH CENTERS", icon: Microscope },
  { name: "CLINICAL NETWORKS", icon: Building2 },
  { name: "LABS", icon: FlaskConical },
]

const institutes = [
  {
    name: "Oxford Clinical Trial Research Unit",
    category: "CLINICAL NETWORKS",
    description:
      "Leading pragmatic trial research, including the landmark RECOVERY trial that saved millions during COVID-19",
    website: "https://www.ndm.ox.ac.uk/octru",
    image: "/oxford-university-clinical-research.jpg",
    color: "bg-brutal-cyan",
    trials: "500+",
    impact: "Millions Saved",
  },
  {
    name: "Johns Hopkins Center for Clinical Trials",
    category: "UNIVERSITIES",
    description: "Pioneering decentralized clinical trials and real-world evidence methodologies",
    website: "https://www.jhsph.edu/research/centers-and-institutes/johns-hopkins-center-for-clinical-trials/",
    image: "/johns-hopkins-medical-research.jpg",
    color: "bg-brutal-yellow",
    trials: "300+",
    impact: "Global Impact",
  },
  {
    name: "NIH All of Us Research Program",
    category: "RESEARCH CENTERS",
    description: "Building diverse health database for precision medicine using pragmatic approaches",
    website: "https://allofus.nih.gov/",
    image: "/nih-research-program.jpg",
    color: "bg-brutal-pink",
    trials: "1M+ Participants",
    impact: "Precision Medicine",
  },
  {
    name: "Duke Clinical Research Institute",
    category: "CLINICAL NETWORKS",
    description: "World's largest academic clinical research organization conducting pragmatic trials",
    website: "https://dcri.org/",
    image: "/duke-clinical-research.jpg",
    color: "bg-brutal-cyan",
    trials: "1000+",
    impact: "Evidence-Based Care",
  },
  {
    name: "Broad Institute",
    category: "LABS",
    description: "Genomic medicine and open-source tools for accelerating disease research",
    website: "https://www.broadinstitute.org/",
    image: "/broad-institute-genomics.jpg",
    color: "bg-brutal-yellow",
    trials: "200+",
    impact: "Open Science",
  },
  {
    name: "Stanford Center for Clinical Research",
    category: "UNIVERSITIES",
    description: "Advancing pragmatic trial design and real-world evidence generation",
    website: "https://med.stanford.edu/clinicalresearch.html",
    image: "/stanford-medical-research.jpg",
    color: "bg-brutal-pink",
    trials: "400+",
    impact: "Innovation Leader",
  },
]

export function InstitutesShowcase() {
  const [selectedCategory, setSelectedCategory] = useState("ALL")

  const filteredInstitutes =
    selectedCategory === "ALL" ? institutes : institutes.filter((i) => i.category === selectedCategory)

  return (
    <>
      {/* Category Filter */}
      <SectionContainer bgColor="cyan" borderPosition="bottom" padding="sm" className="!py-8">
        <Container>
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category) => {
              const Icon = category.icon
              return (
                <Button
                  key={category.name}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`border-4 border-primary font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all ${
                    selectedCategory === category.name
                      ? "bg-foreground text-background"
                      : "bg-background text-foreground hover:bg-foreground hover:text-background"
                  }`}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {category.name}
                </Button>
              )
            })}
          </div>
        </Container>
      </SectionContainer>

      {/* Institutes Grid */}
      <SectionContainer bgColor="background" borderPosition="bottom" padding="lg">
        <Container>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredInstitutes.map((institute, index) => (
              <InstituteShowcaseCard key={index} {...institute} />
            ))}
          </div>
        </Container>
      </SectionContainer>
    </>
  )
}
