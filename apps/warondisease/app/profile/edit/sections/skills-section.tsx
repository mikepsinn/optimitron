"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Award } from "lucide-react"

interface Skill {
  id: string
  name: string
  slug: string
  category: string | null
  endorsements: number
  addedAt: Date
}

interface SkillsSectionProps {
  initialSkills?: Skill[]
}

export function SkillsSection(_props: SkillsSectionProps) {
  return (
    <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <CardHeader>
        <CardTitle className="text-2xl font-black uppercase">Your Skills</CardTitle>
        <CardDescription className="font-bold">
          Showcase your expertise and abilities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 border-4 border-dashed border-primary rounded-none bg-brutal-yellow">
          <Award className="w-12 h-12 mx-auto mb-4" />
          <p className="text-lg font-black uppercase mb-2">Coming Soon</p>
          <p className="text-sm font-bold">
            Skills tagging moved off the old Skill tables. We&apos;ll wire this back to Person
            tags shortly.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
