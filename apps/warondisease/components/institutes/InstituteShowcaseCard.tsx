import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"

interface InstituteShowcaseCardProps {
  name: string
  category: string
  description: string
  website: string
  image: string
  color: string
  trials: string
  impact: string
}

export function InstituteShowcaseCard({
  name,
  category,
  description,
  website,
  image,
  color,
  trials,
  impact,
}: InstituteShowcaseCardProps) {
  return (
    <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden group hover:translate-x-2 hover:translate-y-2 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
      <div className="relative overflow-hidden">
        <img src={image || "/placeholder.svg"} alt={name} className="w-full h-48 object-cover" />
        <div className={`absolute top-4 left-4 ${color} border-2 border-primary px-3 py-1`}>
          <span className="font-black uppercase text-xs text-foreground">{category}</span>
        </div>
      </div>
      <div className="p-6 bg-card">
        <h3 className="text-2xl font-black uppercase mb-3 text-foreground">{name}</h3>
        <p className="font-bold mb-4 text-sm text-foreground">{description}</p>
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <div className="text-xs font-bold uppercase text-foreground/70">Trials</div>
            <div className="font-black text-foreground">{trials}</div>
          </div>
          <div className="flex-1">
            <div className="text-xs font-bold uppercase text-foreground/70">Impact</div>
            <div className="font-black text-foreground">{impact}</div>
          </div>
        </div>
        <a href={website} target="_blank" rel="noopener noreferrer">
          <Button className="w-full bg-foreground text-background border-4 border-primary hover:bg-brutal-cyan hover:text-foreground font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            VISIT SITE
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </a>
      </div>
    </Card>
  )
}
