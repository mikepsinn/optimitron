import { Card } from '@/components/ui/card'
import { BarChart3, FileText, Activity, ArrowUpRight } from 'lucide-react'
import { EXTERNAL_LINKS } from '@/lib/external-links'

const RESOURCE_CARDS = [
  {
    link: EXTERNAL_LINKS.dfdaStudies,
    icon: Activity,
    color: 'bg-brutal-pink',
  },
  {
    link: EXTERNAL_LINKS.dfdaImpact,
    icon: BarChart3,
    color: 'bg-brutal-cyan',
  },
  {
    link: EXTERNAL_LINKS.dfdaSpec,
    icon: FileText,
    color: 'bg-brutal-yellow',
  },
] as const

export function ExternalLinksSection() {
  return (
    <section className="py-20 bg-brutal-purple border-b-4 border-primary">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-black text-4xl md:text-5xl mb-6 text-center">
            STUDIES & TOOLS
          </h2>
          <p className="text-xl font-bold text-center mb-12 text-balance">
            Track your health, explore the economic case, and read the full protocol specification.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {RESOURCE_CARDS.map(({ link, icon: Icon, color }) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Card className={`p-8 ${color} border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] transition-all h-full`}>
                  <div className="flex items-start justify-between mb-4">
                    <Icon className="w-12 h-12 stroke-[3px]" />
                    <ArrowUpRight className="w-6 h-6 stroke-[3px]" />
                  </div>
                  <h3 className="font-black text-2xl uppercase mb-3">{link.title}</h3>
                  <p className="font-bold text-lg">{link.description}</p>
                </Card>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
