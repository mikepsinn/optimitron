import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { getAllConditions } from '@/lib/conditions'

const FEATURED_CONDITION_NAMES = [
  'Major Depressive Disorder',
  'Type 2 Diabetes',
  "Alzheimer's Disease",
  'Breast Cancer',
  'Coronary Artery Disease',
  'Asthma',
]

const DISPLAY_NAMES: Record<string, string> = {
  'Major Depressive Disorder': 'Depression',
  'Type 2 Diabetes': 'Diabetes',
  "Alzheimer's Disease": "Alzheimer's",
  'Breast Cancer': 'Cancer',
  'Coronary Artery Disease': 'Heart Disease',
  'Asthma': 'Asthma',
}

const CARD_COLORS = [
  'bg-brutal-pink',
  'bg-brutal-cyan',
  'bg-brutal-yellow',
  'bg-brutal-green',
  'bg-brutal-purple',
  'bg-brutal-pink',
]

function formatAffected(count: number): string {
  if (count >= 1_000_000_000) return `${(count / 1_000_000_000).toFixed(1)}B`
  if (count >= 1_000_000) return `${Math.round(count / 1_000_000)}M`
  if (count >= 1_000) return `${Math.round(count / 1_000)}K`
  return String(count)
}

export function FeaturedConditions() {
  const allConditions = getAllConditions()

  const featured = FEATURED_CONDITION_NAMES.map((name, i) => {
    const condition = allConditions.find(
      (c) => c.name.toLowerCase() === name.toLowerCase() ||
        c.synonyms.some((s) => s.toLowerCase() === name.toLowerCase())
    )
    if (!condition) return null

    return {
      ...condition,
      displayName: DISPLAY_NAMES[name] || name,
      color: CARD_COLORS[i],
    }
  }).filter(Boolean) as Array<typeof allConditions[number] & { displayName: string; color: string }>

  return (
    <div className="mt-12">
      <p className="text-sm font-black uppercase mb-6">EXPLORE CONDITIONS:</p>
      <div className="grid md:grid-cols-3 gap-4">
        {featured.map((condition) => (
          <Link key={condition.slug} href={`/conditions/${condition.slug}`}>
            <Card className={`p-4 ${condition.color} border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all`}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{condition.emoji}</span>
                <div className="text-left">
                  <h3 className="font-black text-lg uppercase">{condition.displayName}</h3>
                  <p className="font-bold text-sm">
                    {formatAffected(condition.peopleAffected)} affected
                    {condition.activeTrialCount > 0 && ` · ${condition.activeTrialCount.toLocaleString()} trials`}
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
