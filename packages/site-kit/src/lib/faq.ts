/**
 * Shared FAQ Content Library
 *
 * Centralized FAQ items and sections that can be reused across site variants.
 * Organized by topic for easy composition and maintenance.
 */

import type { FaqConfig } from './site-config'
import { formatParameter } from "@optimitron/impact-params/format"
import {
  RECOVERY_TRIAL_COST_REDUCTION_FACTOR,
  PEACE_DIVIDEND_ANNUAL_SOCIETAL_BENEFIT,
  GLOBAL_REGISTERED_VOTERS,
  TREATY_ANNUAL_FUNDING,
  DFDA_BENEFIT_RD_ONLY_ANNUAL,
} from "@optimitron/impact-params/parameters"

// ============================================================================
// INDIVIDUAL FAQ ITEMS (Reusable Questions)
// ============================================================================

export const FAQ_ITEMS = {
  // Treaty Questions
  whatIsTreaty: {
    q: "What is the 1% Treaty?",
    a: "The 1% Treaty is a global agreement where nations redirect just 1% of their military spending to fund pragmatic clinical trials integrated into standard healthcare. This gives everyone 1% more security (fewer nuclear weapons pointed at them) while accelerating access to life-saving treatments by years.",
  },
  whyOnePercent: {
    q: "Why 1%? Why not more or less?",
    a: `1% is strategically chosen because it's small enough to be feasible (doesn't compromise national defense) but large enough to be transformative (${formatParameter(TREATY_ANNUAL_FUNDING)} annually). It's also psychologically powerful: everyone gets 1% more security while gaining years of life through faster medical progress.`,
  },
  militaryImpact: {
    q: "What happens to military capabilities with 1% less funding?",
    a: "Virtually nothing. Modern militaries have massive redundancy and waste. A 1% reduction is easily absorbed through efficiency improvements, reduced procurement waste, or delayed upgrades. No country loses meaningful defensive capability, but everyone gains health security.",
  },
  whichCountries: {
    q: "Which countries would participate?",
    a: "The treaty is designed for universal participation, but the top 15 military spenders (US, China, Russia, India, Saudi Arabia, UK, Germany, France, Japan, South Korea, Italy, Australia, Canada, Israel, Spain) account for 81% of global military spending. Their participation alone would fund the entire system.",
  },

  // Pragmatic Trials Questions
  whatArePragmaticTrials: {
    q: "What are pragmatic trials?",
    a: `Pragmatic trials test treatments in real-world healthcare settings using existing medical records and routine care, rather than creating expensive artificial research environments. Patients receive normal care while data is automatically collected, making trials ${RECOVERY_TRIAL_COST_REDUCTION_FACTOR.value}x cheaper than traditional methods.`,
  },
  howCheaper: {
    q: `How are they ${RECOVERY_TRIAL_COST_REDUCTION_FACTOR.value}x cheaper?`,
    a: `Traditional trials cost $20B+ in recruitment, $15B in manual data collection, $10B in dedicated research sites, and $5B in regulatory overhead. Pragmatic trials eliminate these costs by using existing healthcare infrastructure, electronic health records, and streamlined protocols. Total savings: ${formatParameter(DFDA_BENEFIT_RD_ONLY_ANNUAL)} annually.`,
  },
  areSafe: {
    q: "Are pragmatic trials as safe and rigorous as traditional trials?",
    a: `Yes. They follow the same scientific principles and regulatory standards. The difference is efficiency, not rigor. Oxford's RECOVERY trial (pragmatic design) enrolled 40,000 patients in months and found effective COVID treatments while traditional trials were still recruiting. Same safety, ${RECOVERY_TRIAL_COST_REDUCTION_FACTOR.value}x faster and cheaper.`,
  },
  whatTreatments: {
    q: "What treatments could be tested?",
    a: "Everything: new drugs, repurposed existing medications, medical devices, surgical techniques, behavioral interventions, prevention strategies. Pragmatic trials excel at comparing real-world effectiveness of treatments, finding optimal doses, and identifying which patients benefit most.",
  },
  howLongResults: {
    q: "How long until we see results?",
    a: "Immediate impact. Pragmatic trials can begin enrolling patients within weeks of approval. Results for acute conditions (like COVID treatments) can come in months. Chronic disease trials take longer but still deliver answers years faster than traditional methods.",
  },

  // Peace Dividend Questions (secondary benefit with caveats)
  whatIsPeaceDividend: {
    q: "What is the peace dividend?",
    a: `The peace dividend is a potential secondary benefit: if redirecting 1% of military spending to health research also reduces global conflict, this could save ${formatParameter(PEACE_DIVIDEND_ANNUAL_SOCIETAL_BENEFIT)} annually. However, this benefit requires geopolitical assumptions and is NOT included in our primary ROI calculations. The core value proposition is the timeline shift - accelerating when cures arrive saves billions of lives regardless of any peace effects.`,
  },
  howReduceConflict: {
    q: "How does redirecting military spending reduce conflict?",
    a: "We don't claim it definitely does. The peace dividend is a potential secondary benefit, not a guaranteed outcome. The primary value comes from the timeline shift: accelerating clinical trials and eliminating efficacy lag saves billions of lives from diseases. Any reduction in conflict would be an additional bonus, but we don't rely on it for our core ROI calculations.",
  },
  isExaggerated: {
    q: `Is the peace dividend realistic?`,
    a: `The peace dividend is speculative - it depends on whether redirecting military spending actually reduces conflict. Global conflict costs are estimated at $14.4 trillion annually (Institute for Economics and Peace), so a 1% reduction would be significant if achieved. However, our primary value proposition doesn't depend on this. The timeline shift benefits (billions of lives saved from earlier cures) are based on concrete disease burden data and trial acceleration estimates.`,
  },

  // Feasibility Questions
  isRealistic: {
    q: "Is this realistic?",
    a: `Yes. A majority of humans on Earth, roughly ${formatParameter(GLOBAL_REGISTERED_VOTERS)}, is large enough to make refusal politically costly. We're building that coalition. Plus, the 1% Treaty offers something rare in politics: a win-win where everyone gains security and health.`,
  },
  howGoverned: {
    q: "How would the Decentralized Institutes of Health be governed?",
    a: "DIH operates as a decentralized network, not a centralized bureaucracy. Participating nations contribute 1% of military spending to a transparent fund. Research priorities are set democratically with input from patients, doctors, and scientists. Trials are conducted by existing healthcare systems. No new massive institution required.",
  },
  pharmaOpposition: {
    q: "What about pharmaceutical company opposition?",
    a: `Pharma companies benefit too. Pragmatic trials reduce their R&D costs by ${RECOVERY_TRIAL_COST_REDUCTION_FACTOR.value}x, accelerating time-to-market and expanding the range of profitable treatments. Repurposed drugs and rare disease treatments become economically viable. The current system is broken for everyone; this fixes it.`,
  },
  preventCorruption: {
    q: "How do we prevent corruption and ensure transparency?",
    a: "Blockchain-based fund tracking, open-source protocols, public trial registries, and real-time results publication. All spending is transparent. All data is public. All decisions are documented. The decentralized structure prevents any single entity from controlling the system.",
  },

  // Getting Involved Questions
  howCanIHelp: (showPoliticalContent: boolean) => ({
    q: "How can I help?",
    a: showPoliticalContent
      ? "Answer the question on our homepage, share your referral link, join our divisions registry if you represent an organization, donate to support the movement, contact your representatives, and spread the word. Every voice counts toward a majority of humans on Earth."
      : "Answer the question on our homepage, share your referral link, join our divisions registry if you represent an organization, donate to support our research, and spread the word. Every voice counts toward a majority of humans on Earth.",
  }),
  researcherHelp: {
    q: "I'm a researcher/doctor. How can I participate?",
    a: "Join our divisions registry, connect with allied organizations, advocate for pragmatic trial adoption in your institution, and help design protocols. We need clinical expertise to make this vision real.",
  },
  policymakerHelp: (showPoliticalContent: boolean) => ({
    q: "I'm a policymaker. What do you need from me?",
    a: showPoliticalContent
      ? "Champion the 1% Treaty in your government, introduce legislation supporting pragmatic trials, allocate funding for pilot programs, and build international coalitions. We can provide policy briefs, talking points, and constituent support."
      : "Learn about pragmatic trials and their potential to transform healthcare efficiency. Review our research on cost-effectiveness and real-world implementation. Consider how evidence-based policy could improve healthcare outcomes in your jurisdiction.",
  }),
  nonParticipatingCountry: {
    q: "What if my country doesn't participate?",
    a: "You still benefit. The treaty creates global public goods: faster medical progress, reduced conflict, and shared knowledge. Even non-participating countries gain access to trial results and treatment advances. But participating countries get priority access and influence over research priorities.",
  },
}

// ============================================================================
// REUSABLE FAQ SECTIONS
// ============================================================================

export const FAQ_SECTIONS = {
  treaty: {
    category: "THE 1% TREATY",
    questions: [
      FAQ_ITEMS.whatIsTreaty,
      FAQ_ITEMS.whyOnePercent,
      FAQ_ITEMS.militaryImpact,
      FAQ_ITEMS.whichCountries,
    ],
  },

  pragmaticTrials: {
    category: "PRAGMATIC TRIALS",
    questions: [
      FAQ_ITEMS.whatArePragmaticTrials,
      FAQ_ITEMS.howCheaper,
      FAQ_ITEMS.areSafe,
      FAQ_ITEMS.whatTreatments,
      FAQ_ITEMS.howLongResults,
    ],
  },

  peaceDividend: {
    category: "THE PEACE DIVIDEND",
    questions: [
      FAQ_ITEMS.whatIsPeaceDividend,
      FAQ_ITEMS.howReduceConflict,
      FAQ_ITEMS.isExaggerated,
    ],
  },

  feasibility: {
    category: "FEASIBILITY & IMPLEMENTATION",
    questions: [
      FAQ_ITEMS.isRealistic,
      FAQ_ITEMS.howGoverned,
      FAQ_ITEMS.pharmaOpposition,
      FAQ_ITEMS.preventCorruption,
    ],
  },

  gettingInvolved: (showPoliticalContent: boolean) => ({
    category: "GETTING INVOLVED",
    questions: [
      FAQ_ITEMS.howCanIHelp(showPoliticalContent),
      FAQ_ITEMS.researcherHelp,
      FAQ_ITEMS.policymakerHelp(showPoliticalContent),
      FAQ_ITEMS.nonParticipatingCountry,
    ],
  }),
}

// ============================================================================
// VARIANT-SPECIFIC FAQ CONFIGURATIONS
// ============================================================================

/**
 * War on Disease FAQ (Political/Activist variant)
 */
export const WAR_ON_DISEASE_FAQ: FaqConfig = {
  title: 'FREQUENTLY ASKED QUESTIONS',
  subtitle: 'Everything you need to know about the 1% Treaty and the war on disease',
  sections: [
    FAQ_SECTIONS.treaty,
    FAQ_SECTIONS.pragmaticTrials,
    FAQ_SECTIONS.peaceDividend,
    FAQ_SECTIONS.feasibility,
    FAQ_SECTIONS.gettingInvolved(true), // Show political content
  ],
  ctaSection: {
    title: 'STILL HAVE QUESTIONS?',
    subtitle: 'Contact us or dive deeper into the research and evidence',
    buttons: [
      { label: 'CONTACT US', href: '/contact', variant: 'primary' },
      { label: 'VIEW RESEARCH', href: '/research', variant: 'secondary' },
    ],
  },
}

/**
 * DIH FAQ (Professional/Institutional variant)
 */
export const DIH_FAQ: FaqConfig = {
  title: 'FREQUENTLY ASKED QUESTIONS',
  subtitle: 'Everything you need to know about the 1% Treaty and pragmatic clinical trials',
  sections: [
    FAQ_SECTIONS.treaty,
    FAQ_SECTIONS.pragmaticTrials,
    FAQ_SECTIONS.peaceDividend,
    FAQ_SECTIONS.feasibility,
    FAQ_SECTIONS.gettingInvolved(false), // No political content
  ],
  ctaSection: {
    title: 'STILL HAVE QUESTIONS?',
    subtitle: 'Contact us or dive deeper into the research and evidence',
    buttons: [
      { label: 'CONTACT US', href: '/contact', variant: 'primary' },
      { label: 'VIEW RESEARCH', href: '/research', variant: 'secondary' },
    ],
  },
}

/**
 * Wishocracy FAQ (Values Research variant)
 */
export const WISHOCRACY_FAQ: FaqConfig = {
  title: 'FREQUENTLY ASKED QUESTIONS',
  subtitle: 'Everything you need to know about discovering your global priorities',
  sections: [
    {
      category: "ABOUT WISHOCRACY",
      questions: [
        {
          q: "What is Wishocracy?",
          a: "Wishocracy is a values research tool that helps you discover your global priorities through pairwise comparisons. By comparing different areas of human concern two at a time, we can measure what matters most to you and to humanity as a whole.",
        },
        {
          q: "How does it work?",
          a: "You'll see pairs of different policy areas (like healthcare, education, environmental protection, etc.) and decide which matters more to you by adjusting a slider. The more comparisons you complete, the clearer your priority ranking becomes. Your choices are anonymous and help us understand collective human values.",
        },
        {
          q: "Why pairwise comparison?",
          a: "Pairwise comparison is proven to be more accurate than ranking lists or rating scales. When you're forced to choose between just two options, it reveals your true priorities. This method has been used in decision science for decades and produces more reliable results than asking people to rate many items at once.",
        },
        {
          q: "Is this political?",
          a: "No. Wishocracy is a neutral values research tool. We're not advocating for any specific policies or political positions. We're simply measuring what people care about most. The results help us understand collective human priorities, which can inform decision-making across sectors.",
        },
        {
          q: "What happens to my data?",
          a: "Your comparisons are stored securely and analyzed in aggregate with other participants. We never share individual data. The goal is to understand collective priorities, not track individual people. You can sign in to save your results, or complete comparisons anonymously.",
        },
      ],
    },
    {
      category: "THE RESEARCH",
      questions: [
        {
          q: "Who created this?",
          a: "Wishocracy was created by researchers studying collective decision-making and resource allocation. It's part of a broader effort to understand how people prioritize competing social goods when resources are limited.",
        },
        {
          q: "How is this data used?",
          a: "Aggregate data helps researchers, policymakers, and organizations understand public priorities. This can inform resource allocation decisions, policy debates, and strategic planning. All published results are anonymized and aggregated.",
        },
        {
          q: "Can I see the results?",
          a: "Yes! After completing comparisons, you'll see your own priority ranking. We also publish aggregate results showing collective priorities across all participants. This helps everyone understand what matters most to humanity as a whole.",
        },
      ],
    },
  ],
  ctaSection: {
    title: 'HAVE MORE QUESTIONS?',
    subtitle: 'Contact us to learn more about the research',
    buttons: [
      { label: 'CONTACT US', href: '/contact', variant: 'primary' },
    ],
  },
}

/**
 * dFDA FAQ (Medical/Clinical variant)
 */
export const DFDA_FAQ: FaqConfig = {
  title: 'FREQUENTLY ASKED QUESTIONS',
  subtitle: 'Everything you need to know about treatment information and clinical trials',
  sections: [
    {
      category: "ABOUT dFDA",
      questions: [
        {
          q: "What is the Decentralized Framework for Drug Assessment?",
          a: "The dFDA is an evidence-based platform providing comprehensive information about medical conditions, treatments, and clinical trials. We aggregate data from research studies, clinical trials, and real-world evidence to help patients and clinicians make informed decisions.",
        },
        {
          q: "How do you evaluate treatments?",
          a: "We use systematic review methods to analyze published research, clinical trial results, and real-world effectiveness data. Treatments are evaluated based on efficacy, safety, quality of evidence, and applicability to different patient populations.",
        },
      ],
    },
    FAQ_SECTIONS.pragmaticTrials,
    {
      category: "FINDING TRIALS",
      questions: [
        {
          q: "How can I find clinical trials for my condition?",
          a: "Browse our conditions database or use the search function. Each condition page lists active clinical trials, eligibility criteria, and enrollment information. You can also use our trial finder tool to match your specific situation with available studies.",
        },
        {
          q: "Should I participate in a clinical trial?",
          a: "That depends on your individual situation. Clinical trials offer access to cutting-edge treatments but may involve risks and inconveniences. Discuss the specific trial with your healthcare provider to determine if it's right for you. We provide information, not medical advice.",
        },
      ],
    },
  ],
  ctaSection: {
    title: 'NEED MORE INFORMATION?',
    subtitle: 'Contact us or explore our research database',
    buttons: [
      { label: 'CONTACT US', href: '/contact', variant: 'primary' },
      { label: 'BROWSE RESEARCH', href: '/research', variant: 'secondary' },
    ],
  },
}

/**
 * Trial Abundance Survey FAQ (Ultra-neutral variant)
 */
export const SURVEY_FAQ: FaqConfig = {
  title: 'FREQUENTLY ASKED QUESTIONS',
  subtitle: 'Everything you need to know about the Global Clinical Trial Abundance Survey',
  sections: [
    {
      category: "ABOUT THE SURVEY",
      questions: [
        {
          q: "What is the Global Clinical Trial Abundance Survey?",
          a: "This is an independent research initiative measuring public support for accelerating medical progress through pragmatic clinical trials. Your participation helps researchers understand how people prioritize healthcare innovation and clinical research.",
        },
        {
          q: "Who is conducting this research?",
          a: "This survey is conducted by independent researchers studying healthcare policy and clinical trial methods. The research is designed to be neutral and non-partisan, focusing solely on understanding public attitudes toward medical research acceleration.",
        },
        {
          q: "How is my data used?",
          a: "All survey responses are anonymous and analyzed in aggregate. Results help researchers understand public support for clinical trial reform and medical research acceleration. Individual responses are never shared or published.",
        },
      ],
    },
    FAQ_SECTIONS.pragmaticTrials,
    {
      category: "PARTICIPATION",
      questions: [
        {
          q: "How long does the survey take?",
          a: "Most participants complete the survey in 2-5 minutes. There are no right or wrong answers – we simply want to understand your views on medical research priorities.",
        },
        {
          q: "Can I participate anonymously?",
          a: "Yes. The survey can be completed without providing any personal information. If you choose to create an account, your contact information is kept separate from your survey responses.",
        },
      ],
    },
  ],
  ctaSection: {
    title: 'QUESTIONS ABOUT THE RESEARCH?',
    subtitle: 'Contact our research team',
    buttons: [
      { label: 'CONTACT RESEARCHERS', href: '/contact', variant: 'primary' },
    ],
  },
}
