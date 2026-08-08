"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Award } from "lucide-react"
import { addUserSkill, removeUserSkill, searchSkills, createSkill } from "../../actions"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface Skill {
  id: string
  name: string
  slug: string
  category: string | null
  endorsements: number
  addedAt: Date
}

interface SkillsSectionProps {
  initialSkills: Skill[]
}

export function SkillsSection({ initialSkills }: SkillsSectionProps) {
  const [skills, setSkills] = useState<Skill[]>(initialSkills)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string; category: string | null }>>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const results = await searchSkills(query)
      // Filter out skills user already has
      const filtered = results.filter((r) => !skills.find((s) => s.id === r.id))
      setSearchResults(filtered)
    } finally {
      setIsSearching(false)
    }
  }

  const handleAddSkill = (skillId: string, skillName: string) => {
    startTransition(() => {
      addUserSkill(skillId)
        .then(() => {
          // Add to local state
          setSkills([
            ...skills,
            {
              id: skillId,
              name: skillName,
              slug: skillName.toLowerCase(),
              category: null,
              endorsements: 0,
              addedAt: new Date(),
            },
          ])
          setSearchQuery("")
          setSearchResults([])
          setIsOpen(false)
        })
        .catch((error) => {
          console.error("Failed to add skill:", error)
        })
    })
  }

  const handleCreateSkill = () => {
    if (!searchQuery.trim()) return

    startTransition(() => {
      createSkill({ name: searchQuery.trim() })
        .then((result) => {
          setSkills([
            ...skills,
            {
              id: result.skill.id,
              name: result.skill.name,
              slug: result.skill.slug,
              category: result.skill.category,
              endorsements: 0,
              addedAt: new Date(),
            },
          ])
          setSearchQuery("")
          setSearchResults([])
          setIsOpen(false)
        })
        .catch((error) => {
          console.error("Failed to create skill:", error)
        })
    })
  }

  const handleRemoveSkill = (skillId: string) => {
    startTransition(() => {
      removeUserSkill(skillId)
        .then(() => {
          setSkills(skills.filter((s) => s.id !== skillId))
        })
        .catch((error) => {
          console.error("Failed to remove skill:", error)
        })
    })
  }

  return (
    <Card className="border-2 border-primary">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-black uppercase">Your Skills</CardTitle>
            <CardDescription className="font-bold">
              Showcase your expertise and abilities
            </CardDescription>
          </div>
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button className="border-2 border-primary bg-brutal-cyan font-bold uppercase">
                <Plus className="w-4 h-4 mr-2" />
                Add Skill
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0 border-2 border-primary" align="end">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Search or create skill..."
                  value={searchQuery}
                  onValueChange={handleSearch}
                />
                <CommandList>
                  {isSearching ? (
                    <div className="py-6 text-center text-sm">Searching...</div>
                  ) : searchResults.length > 0 ? (
                    <CommandGroup heading="Select a skill">
                      {searchResults.map((skill) => (
                        <CommandItem
                          key={skill.id}
                          onSelect={() => handleAddSkill(skill.id, skill.name)}
                          className="cursor-pointer"
                        >
                          <Award className="w-4 h-4 mr-2" />
                          <div>
                            <div className="font-bold">{skill.name}</div>
                            {skill.category && (
                              <div className="text-xs text-muted-foreground">{skill.category}</div>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ) : searchQuery.length >= 2 ? (
                    <CommandEmpty>
                      <div className="py-4">
                        <p className="text-sm mb-3">No skills found.</p>
                        <Button
                          size="sm"
                          onClick={handleCreateSkill}
                          disabled={isPending}
                          className="border-2 border-primary bg-brutal-yellow font-bold uppercase"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create "{searchQuery}"
                        </Button>
                      </div>
                    </CommandEmpty>
                  ) : (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      Type to search for skills
                    </div>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent>
        {skills.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-primary rounded-lg bg-muted/20">
            <Award className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-bold mb-2">No skills yet</p>
            <p className="text-sm text-muted-foreground">
              Add skills to showcase your expertise
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <Badge
                key={skill.id}
                variant="secondary"
                className="border-2 border-primary bg-background text-foreground text-sm px-3 py-2 font-bold"
              >
                {skill.name}
                {skill.endorsements > 0 && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({skill.endorsements})
                  </span>
                )}
                <button
                  onClick={() => handleRemoveSkill(skill.id)}
                  disabled={isPending}
                  className="ml-2 hover:text-red-600 transition-colors"
                  aria-label={`Remove ${skill.name}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
