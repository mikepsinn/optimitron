import Link from 'next/link'
import { getAllConditions } from '@/lib/conditions'

const POPULAR_CONDITION_NAMES = [
  'Major Depressive Disorder',
  'Type 2 Diabetes',
  "Alzheimer's Disease",
  'Breast Cancer',
  'Coronary Artery Disease',
  'Asthma',
  'Rheumatoid Arthritis',
]

export function PopularConditions() {
  const allConditions = getAllConditions()

  // Find the actual conditions by name to get correct slugs
  const popularConditions = POPULAR_CONDITION_NAMES.map((name) => {
    const condition = allConditions.find(
      (c) => c.name.toLowerCase() === name.toLowerCase() ||
        c.synonyms.some((s) => s.toLowerCase() === name.toLowerCase())
    )

    if (!condition) {
      console.warn(`Popular condition not found: ${name}`)
      return null
    }

    return {
      name: name.includes('Diabetes') ? 'Diabetes' :
        name.includes('Depression') ? 'Depression' :
          name.includes('Alzheimer') ? "Alzheimer's" :
            name.includes('Cancer') ? 'Cancer' :
              name.includes('Coronary') ? 'Heart Disease' :
                name.includes('Pain') ? 'Chronic Pain' :
                  name.includes('Asthma') ? 'Asthma' :
                    name.includes('Arthritis') ? 'Arthritis' :
                      name,
      slug: condition.slug,
    }
  }).filter(Boolean) as Array<{ name: string; slug: string }>

  return (
    <div className="mt-8">
      <p className="text-sm font-black uppercase mb-4">EXPLORE POPULAR CONDITIONS:</p>
      <div className="flex flex-wrap gap-3 justify-center">
        {popularConditions.map((condition) => (
          <Link key={condition.slug} href={`/conditions/${condition.slug}`}>
            <button className="px-4 py-2 bg-white border-4 border-primary font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
              {condition.name}
            </button>
          </Link>
        ))}
      </div>
    </div>
  )
}
