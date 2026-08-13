import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { getAllTreatments } from '@/lib/treatments'

const EXCLUDED_TREATMENTS = ['placebo', 'control', 'no treatment', 'waitlist']

const CARD_COLORS = [
  'bg-brutal-cyan',
  'bg-brutal-yellow',
  'bg-brutal-green',
  'bg-brutal-pink',
  'bg-brutal-purple',
  'bg-brutal-cyan',
]

function getEffectivenessLabel(score: number): string {
  if (score >= 80) return 'VERY HIGH'
  if (score >= 60) return 'HIGH'
  if (score >= 40) return 'MODERATE'
  return 'LOW'
}

export function FeaturedTreatments() {
  const allTreatments = getAllTreatments()

  const featured = allTreatments
    .filter(t => !EXCLUDED_TREATMENTS.includes(t.name.toLowerCase()))
    .sort((a, b) => b.totalParticipants - a.totalParticipants)
    .slice(0, 6)

  if (featured.length === 0) return null

  return (
    <section className="py-20 bg-brutal-green border-b-4 border-primary">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-black text-4xl md:text-5xl mb-6 text-center">
            TOP TREATMENTS BY EVIDENCE
          </h2>
          <p className="text-xl font-bold text-center mb-12 text-balance">
            The most-studied treatments across all conditions, ranked by total research participants.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {featured.map((treatment, i) => (
              <Link key={treatment.slug} href={`/treatments/${treatment.slug}`}>
                <Card className={`p-6 ${CARD_COLORS[i]} border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] transition-all h-full`}>
                  <h3 className="font-black text-xl uppercase mb-3">{treatment.name}</h3>
                  <div className="space-y-2">
                    <p className="font-bold text-sm">
                      Treats {treatment.conditions.length} condition{treatment.conditions.length !== 1 ? 's' : ''}
                    </p>
                    <p className="font-bold text-sm">
                      {treatment.totalTrials.toLocaleString()} trials · {treatment.totalParticipants.toLocaleString()} participants
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-1 bg-primary text-primary-foreground font-black text-xs uppercase">
                        {getEffectivenessLabel(treatment.avgEffectiveness)} EFFECTIVENESS
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
