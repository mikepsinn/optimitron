/**
 * Policy Exemplars — Proven Policies from Around the World
 *
 * Each exemplar documents a real policy that has been implemented,
 * measured, and shown to produce significant positive outcomes.
 * Data sourced from peer-reviewed studies, government evaluations,
 * and international organization reports.
 *
 * The "estimatedTransferability" field reflects how portable the
 * policy is to other national contexts, accounting for institutional,
 * cultural, and economic prerequisites.
 *
 * Sources:
 * - WHO, World Bank, OECD country reviews
 * - Peer-reviewed journals (Lancet, BMJ, JAMA, etc.)
 * - Government evaluation reports
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PolicyOutcome {
  /** What was measured */
  metric: string;
  /** Value before the policy (or comparator baseline) */
  beforeValue: number;
  /** Value after the policy (or most recent measurement) */
  afterValue: number;
  /** Percentage change: ((after - before) / before) × 100 */
  changePercent: number;
}

export type Transferability = 'high' | 'medium' | 'low';

export interface PolicyExemplar {
  /** Policy name */
  name: string;
  /** Country of origin */
  originCountry: string;
  /** Policy category */
  category: string;
  /** What the policy does */
  description: string;
  /** Year (approximately) implemented */
  yearImplemented: number;
  /** Measured outcomes with before/after data */
  outcomes: PolicyOutcome[];
  /** How transferable this policy is to other countries */
  estimatedTransferability: Transferability;
  /** Notes on what would need to change for adoption elsewhere */
  adaptationNotes: string;
  /** Published sources */
  sources: string[];
}

// ─── Data ────────────────────────────────────────────────────────────────────

export const POLICY_EXEMPLARS: PolicyExemplar[] = [
  // ─── Health ──────────────────────────────────────────────────────────────
  {
    name: 'Singapore 3M Health System (Medisave / MediShield / Medifund)',
    originCountry: 'Singapore',
    category: 'Health',
    description:
      'Three-tier universal health financing: (1) Medisave — mandatory health savings accounts ' +
      '(7-9.5% of wages); (2) MediShield Life — national catastrophic insurance; ' +
      '(3) Medifund — safety net for those who cannot pay. Government owns most hospitals ' +
      'but uses competition and co-payments to control costs. Spending is ~4% of GDP yet ' +
      'outcomes rival or exceed countries spending 3-4× more.',
    yearImplemented: 1984,
    outcomes: [
      {
        metric: 'Health spending per capita (USD PPP)',
        beforeValue: 600,
        afterValue: 3013,
        changePercent: 402,
      },
      {
        metric: 'Life expectancy (years)',
        beforeValue: 73.0,
        afterValue: 84.1,
        changePercent: 15.2,
      },
      {
        metric: 'Infant mortality per 1,000',
        beforeValue: 9.3,
        afterValue: 1.7,
        changePercent: -81.7,
      },
      {
        metric: 'Health spending as % GDP (vs US 17.3%)',
        beforeValue: 3.0,
        afterValue: 4.1,
        changePercent: 36.7,
      },
    ],
    estimatedTransferability: 'medium',
    adaptationNotes:
      'Requires strong government capacity, compact geography, and cultural acceptance of ' +
      'mandatory savings. Co-payment structure needs calibration for lower-income populations. ' +
      'Elements (HSAs + catastrophic insurance) adopted by several countries.',
    sources: [
      'Haseltine, W. (2013). Affordable Excellence: The Singapore Healthcare Story. Brookings.',
      'WHO Singapore Health System Review, Health Systems in Transition (2022)',
      'Tan, C.C. et al. "Singapore\'s health-care system: key features, challenges, and shifts." Lancet (2021)',
    ],
  },
  {
    name: 'Portugal Drug Decriminalization',
    originCountry: 'Portugal',
    category: 'Drug Policy',
    description:
      'In 2001, Portugal decriminalized personal possession of all drugs (up to a 10-day supply). ' +
      'Users caught by police are referred to "Dissuasion Commissions" (panels of social workers, ' +
      'lawyers, psychologists) instead of criminal courts. Heavy investment in treatment, ' +
      'harm reduction, and social reintegration.',
    yearImplemented: 2001,
    outcomes: [
      {
        metric: 'Drug-induced deaths per million (2001→2017)',
        beforeValue: 80,
        afterValue: 16,
        changePercent: -80,
      },
      {
        metric: 'New HIV cases among PWID (per year)',
        beforeValue: 1016,
        afterValue: 18,
        changePercent: -98.2,
      },
      {
        metric: 'Drug use prevalence (15-64, any drug, %)',
        beforeValue: 7.8,
        afterValue: 8.0,
        changePercent: 2.6,
      },
      {
        metric: 'People in drug treatment (thousands)',
        beforeValue: 23,
        afterValue: 37,
        changePercent: 60.9,
      },
    ],
    estimatedTransferability: 'high',
    adaptationNotes:
      'The dissuasion commission model is highly transferable. Key prerequisite: simultaneous ' +
      'investment in treatment infrastructure. Without expanded treatment, decriminalization ' +
      'alone may not achieve the same outcomes. Political will and destigmatization are needed.',
    sources: [
      'Hughes, C.E. & Stevens, A. "What can we learn from the Portuguese decriminalization of illicit drugs?" British J. of Criminology (2010)',
      'Gonçalves, R. et al. "A 15-year review of Portuguese drug policy." EMCDDA (2017)',
      'SICAD (Serviço de Intervenção nos Comportamentos Aditivos e nas Dependências). Annual Report 2022.',
    ],
  },
  {
    name: 'Finland Education Reform',
    originCountry: 'Finland',
    category: 'Education',
    description:
      'Comprehensive reform from 1970s onward: eliminated standardized testing (except one ' +
      'national exam at 18), gave teachers high autonomy and required master\'s degrees, ' +
      'minimized homework, extended recess, and equalized funding across schools. ' +
      'Teaching is a prestigious, competitive profession (10% acceptance rate).',
    yearImplemented: 1972,
    outcomes: [
      {
        metric: 'PISA ranking among OECD (science, 2006 peak)',
        beforeValue: 20,
        afterValue: 1,
        changePercent: -95,
      },
      {
        metric: 'Achievement gap top/bottom quintile (PISA points)',
        beforeValue: 100,
        afterValue: 62,
        changePercent: -38,
      },
      {
        metric: 'Teaching profession applicant acceptance rate (%)',
        beforeValue: 30,
        afterValue: 10,
        changePercent: -66.7,
      },
      {
        metric: 'Upper secondary completion rate (%)',
        beforeValue: 78,
        afterValue: 93,
        changePercent: 19.2,
      },
    ],
    estimatedTransferability: 'medium',
    adaptationNotes:
      'Requires cultural shift: trusting and empowering teachers, reducing testing culture. ' +
      'Teacher training pipeline takes years to build. Equity-first funding model may face ' +
      'political resistance. Small country size helped implementation.',
    sources: [
      'Sahlberg, P. (2021). Finnish Lessons 3.0. Teachers College Press.',
      'OECD PISA 2022 Results. Paris.',
      'Darling-Hammond, L. "Teacher education around the world: What can we learn?" European J. of Teacher Education (2017)',
    ],
  },
  {
    name: 'Norway Rehabilitative Prisons (Halden Model)',
    originCountry: 'Norway',
    category: 'Criminal Justice',
    description:
      'Norway\'s prison system treats incarceration as the punishment — conditions inside aim ' +
      'for "normality." Halden Prison (opened 2010) has no bars on windows, extensive vocational ' +
      'training, education, and mental health services. Guards are trained for 2 years. ' +
      'Maximum sentence is 21 years. Focus on preparing inmates for reintegration.',
    yearImplemented: 2010,
    outcomes: [
      {
        metric: 'Recidivism rate (% within 2 years)',
        beforeValue: 60,
        afterValue: 20,
        changePercent: -66.7,
      },
      {
        metric: 'Annual cost per prisoner (USD)',
        beforeValue: 40000,
        afterValue: 93000,
        changePercent: 132.5,
      },
      {
        metric: 'Incarceration rate per 100K',
        beforeValue: 65,
        afterValue: 56,
        changePercent: -13.8,
      },
      {
        metric: 'Prison violence incidents (per 1,000 inmates)',
        beforeValue: 45,
        afterValue: 12,
        changePercent: -73.3,
      },
    ],
    estimatedTransferability: 'medium',
    adaptationNotes:
      'Higher per-prisoner cost offset by massive savings from lower recidivism (fewer future ' +
      'crimes, trials, incarcerations). Requires political willingness to move away from punitive ' +
      'framing. Small-scale pilots (like NDCS Halden-inspired unit in Singapore) show promise.',
    sources: [
      'Pratt, J. "Scandinavian Exceptionalism in an Era of Penal Excess." British J. of Criminology (2008)',
      'Kriminalomsorgen (Norwegian Correctional Service). Annual Statistics 2022.',
      'Sterbenz, C. "Why Norway\'s prison system is so successful." Business Insider (2014)',
    ],
  },
  {
    name: 'Estonia e-Governance (X-Road Digital ID)',
    originCountry: 'Estonia',
    category: 'Governance',
    description:
      'Since 2001, Estonia built a comprehensive digital governance platform (X-Road) connecting ' +
      'all government services. Citizens have digital ID cards enabling e-voting, e-tax filing, ' +
      'e-prescriptions, e-residency for foreign entrepreneurs, and 99% of government services online. ' +
      'Blockchain-based infrastructure ensures data integrity.',
    yearImplemented: 2001,
    outcomes: [
      {
        metric: 'Government services available online (%)',
        beforeValue: 10,
        afterValue: 99,
        changePercent: 890,
      },
      {
        metric: 'Time saved per citizen annually (hours)',
        beforeValue: 0,
        afterValue: 240,
        changePercent: 100,
      },
      {
        metric: 'Tax filing time (minutes)',
        beforeValue: 480,
        afterValue: 3,
        changePercent: -99.4,
      },
      {
        metric: 'GDP saved from digital efficiency (% of GDP)',
        beforeValue: 0,
        afterValue: 2.0,
        changePercent: 100,
      },
    ],
    estimatedTransferability: 'high',
    adaptationNotes:
      'X-Road is open-source and has been adopted by Finland, Iceland, and Japan. ' +
      'Requires investment in broadband infrastructure, digital literacy programs, ' +
      'and strong data protection laws. Smaller populations can implement faster.',
    sources: [
      'e-Estonia.com — Official Digital Society portal.',
      'Margetts, H. & Naumann, A. "Government as a Platform." Institute for Government (2017)',
      'Kattel, R. & Mergel, I. "Estonia\'s digital transformation." Government Information Quarterly (2019)',
    ],
  },
  {
    name: 'Rwanda Community Health Workers (CHW) Program',
    originCountry: 'Rwanda',
    category: 'Health',
    description:
      'After the 1994 genocide, Rwanda built a network of 45,000+ community health workers ' +
      '(3 per village) providing basic care, maternal/child health services, TB/HIV treatment ' +
      'adherence support, and health education. CHWs are elected by their communities and ' +
      'receive performance-based incentives.',
    yearImplemented: 1995,
    outcomes: [
      {
        metric: 'Under-5 mortality per 1,000 live births',
        beforeValue: 196,
        afterValue: 45,
        changePercent: -77,
      },
      {
        metric: 'Life expectancy (years)',
        beforeValue: 29,
        afterValue: 69,
        changePercent: 137.9,
      },
      {
        metric: 'HIV treatment coverage (%)',
        beforeValue: 5,
        afterValue: 92,
        changePercent: 1740,
      },
      {
        metric: 'Health insurance coverage (%)',
        beforeValue: 7,
        afterValue: 79,
        changePercent: 1028.6,
      },
    ],
    estimatedTransferability: 'high',
    adaptationNotes:
      'CHW programs are among the most transferable health interventions globally. ' +
      'Key success factors: community election of CHWs, regular supervision, supply chain for ' +
      'basic medicines, and integration with formal health system. Already replicated in ' +
      'Ethiopia, Liberia, Malawi, and others.',
    sources: [
      'Binagwaho, A. et al. "Rwanda 20 years on: investing in life." Lancet (2014)',
      'WHO. "Community health workers: what do we know about them?" (2007)',
      'Rwanda Ministry of Health. Health Sector Annual Report 2021-2022.',
    ],
  },
  {
    name: 'Japan Tokutei Kenshin (Specific Health Checkups)',
    originCountry: 'Japan',
    category: 'Health',
    description:
      'Since 2008, Japan mandates annual metabolic syndrome screening for all adults aged 40-74. ' +
      'Employers and insurers must achieve participation targets. Those identified as at-risk ' +
      'receive mandatory lifestyle counseling. The program targets the leading cause of healthcare ' +
      'costs: metabolic syndrome and its complications.',
    yearImplemented: 2008,
    outcomes: [
      {
        metric: 'Screening participation rate (%)',
        beforeValue: 38,
        afterValue: 58,
        changePercent: 52.6,
      },
      {
        metric: 'Metabolic syndrome prevalence among screened (%)',
        beforeValue: 28,
        afterValue: 23,
        changePercent: -17.9,
      },
      {
        metric: 'Healthcare cost growth rate (annual %)',
        beforeValue: 3.5,
        afterValue: 2.0,
        changePercent: -42.9,
      },
      {
        metric: 'Life expectancy (years, 2008→2022)',
        beforeValue: 82.6,
        afterValue: 84.8,
        changePercent: 2.7,
      },
    ],
    estimatedTransferability: 'high',
    adaptationNotes:
      'Employer mandate model may not fit gig-economy labor markets. Universal health coverage ' +
      'is a prerequisite to make screening free at point of use. Can be adapted as voluntary ' +
      'incentivized screening in insurance-based systems.',
    sources: [
      'Tsushita, K. et al. "Rationale and descriptive analysis of specific health guidance." J. of Atherosclerosis & Thrombosis (2018)',
      'Ministry of Health, Labour and Welfare. Annual Report on Health, Labour and Welfare 2022.',
      'OECD Reviews of Public Health: Japan (2019)',
    ],
  },
  {
    name: 'Denmark Cycling Infrastructure',
    originCountry: 'Denmark',
    category: 'Urban Planning / Public Health',
    description:
      'Denmark (Copenhagen especially) invested heavily in separated cycling infrastructure since ' +
      'the 1970s: 390+ km of separated bike lanes, bike bridges, green waves (traffic lights timed ' +
      'for cyclist speed), bike superhighways connecting suburbs. 62% of Copenhagen residents cycle ' +
      'to work or school daily.',
    yearImplemented: 1973,
    outcomes: [
      {
        metric: 'Cycling modal share in Copenhagen (%)',
        beforeValue: 20,
        afterValue: 62,
        changePercent: 210,
      },
      {
        metric: 'CO2 emissions from transport (per capita, relative to 1990)',
        beforeValue: 100,
        afterValue: 65,
        changePercent: -35,
      },
      {
        metric: 'Cyclist fatalities per billion km cycled',
        beforeValue: 40,
        afterValue: 11,
        changePercent: -72.5,
      },
      {
        metric: 'Annual healthcare savings from cycling (DKK billions)',
        beforeValue: 0,
        afterValue: 5.6,
        changePercent: 100,
      },
    ],
    estimatedTransferability: 'high',
    adaptationNotes:
      'Flat terrain helps Copenhagen, but infrastructure investment is the decisive factor — ' +
      'hilly cities like Bogotá and San Francisco have built successful networks too. ' +
      'Requires political commitment to reallocate road space from cars to bikes.',
    sources: [
      'Cycling Embassy of Denmark. "Copenhagen City of Cyclists: Facts & Figures 2022."',
      'Pucher, J. & Buehler, R. "Making Cycling Irresistible." Transport Reviews (2008)',
      'Copenhagenize Design Co. "The Copenhagenize Index 2019."',
    ],
  },
  {
    name: 'South Korea Broadband Policy',
    originCountry: 'South Korea',
    category: 'Technology / Infrastructure',
    description:
      'Starting in 1999, South Korea implemented the Cyber Korea 21 plan followed by successive ' +
      'broadband frameworks: government-subsidized fiber-to-the-home, mandatory open access for ISPs, ' +
      'direct subsidies for low-income broadband, and ambitious speed targets. Created the most ' +
      'connected nation on earth.',
    yearImplemented: 1999,
    outcomes: [
      {
        metric: 'Household broadband penetration (%)',
        beforeValue: 2,
        afterValue: 99.9,
        changePercent: 4895,
      },
      {
        metric: 'Average connection speed (Mbps)',
        beforeValue: 0.5,
        afterValue: 210,
        changePercent: 41900,
      },
      {
        metric: 'ICT sector as % of GDP',
        beforeValue: 5.0,
        afterValue: 11.2,
        changePercent: 124,
      },
      {
        metric: 'Monthly broadband cost (USD, fiber)',
        beforeValue: 50,
        afterValue: 25,
        changePercent: -50,
      },
    ],
    estimatedTransferability: 'medium',
    adaptationNotes:
      'South Korea\'s dense urban population makes fiber economics favorable. Rural/sparsely ' +
      'populated countries need adapted approaches (5G fixed wireless, satellite). ' +
      'The regulatory model (open access, competition mandates) is widely transferable.',
    sources: [
      'ITU Broadband Commission. "The State of Broadband 2023."',
      'OECD Digital Economy Outlook 2022.',
      'Kim, S.T. "Korea\'s Broadband Success." ITU case study (2003).',
    ],
  },
  {
    name: 'Costa Rica Universal Healthcare (CCSS)',
    originCountry: 'Costa Rica',
    category: 'Health',
    description:
      'The Caja Costarricense de Seguro Social (CCSS) provides universal health coverage funded by ' +
      'tripartite contributions (employer, employee, government). Costa Rica abolished its military ' +
      'in 1948 and redirected spending to health and education. Achieves life expectancy comparable ' +
      'to the US at roughly 1/10th the per-capita cost.',
    yearImplemented: 1941,
    outcomes: [
      {
        metric: 'Life expectancy (years)',
        beforeValue: 55,
        afterValue: 80.3,
        changePercent: 46,
      },
      {
        metric: 'Health spending per capita (USD PPP)',
        beforeValue: 200,
        afterValue: 1285,
        changePercent: 542.5,
      },
      {
        metric: 'Infant mortality per 1,000',
        beforeValue: 90,
        afterValue: 7.0,
        changePercent: -92.2,
      },
      {
        metric: 'Population coverage (%)',
        beforeValue: 15,
        afterValue: 95,
        changePercent: 533.3,
      },
    ],
    estimatedTransferability: 'high',
    adaptationNotes:
      'The CCSS model is well-studied and has been partially adapted by other Latin American ' +
      'countries. Key enablers: early decision to invest in primary care over tertiary care, ' +
      'community-based EBAIS clinics, and political stability.',
    sources: [
      'WHO. "Costa Rica Health System Profile." Health Systems in Transition (2023).',
      'Pesec, M. et al. "Primary health care that works: the Costa Rican experience." Health Affairs (2017)',
      'World Bank WDI. Costa Rica health indicators.',
    ],
  },
  {
    name: 'Netherlands Housing First Policy',
    originCountry: 'Netherlands',
    category: 'Social Policy / Housing',
    description:
      'Since 2006, the Netherlands adopted Housing First for chronically homeless people. ' +
      'Individuals are given permanent housing without preconditions (sobriety, treatment compliance). ' +
      'Wraparound support services (mental health, addiction, employment) are offered but not required. ' +
      'Part of the broader Plan van Aanpak Maatschappelijke Opvang.',
    yearImplemented: 2006,
    outcomes: [
      {
        metric: 'Housing retention after 12 months (%)',
        beforeValue: 30,
        afterValue: 86,
        changePercent: 186.7,
      },
      {
        metric: 'Rough sleepers in major cities',
        beforeValue: 12000,
        afterValue: 4000,
        changePercent: -66.7,
      },
      {
        metric: 'Cost per person vs shelter/emergency cycle (ratio)',
        beforeValue: 1.0,
        afterValue: 0.65,
        changePercent: -35,
      },
      {
        metric: 'Quality of life score (EQ-5D index)',
        beforeValue: 0.45,
        afterValue: 0.72,
        changePercent: 60,
      },
    ],
    estimatedTransferability: 'high',
    adaptationNotes:
      'Housing First has been successfully replicated in Finland, Canada (At Home/Chez Soi), ' +
      'France, and parts of the US. Main barrier: availability and cost of housing stock. ' +
      'Works best when paired with subsidized housing supply.',
    sources: [
      'Goering, P. et al. "National At Home/Chez Soi Final Report." Mental Health Commission of Canada (2014)',
      'Busch-Geertsema, V. "Housing First Europe: Final Report." European Commission (2013)',
      'Pleace, N. "Housing First Guide Europe." FEANTSA (2016)',
    ],
  },
  {
    name: 'Switzerland Supervised Injection Sites',
    originCountry: 'Switzerland',
    category: 'Drug Policy / Public Health',
    description:
      'Switzerland opened the first legal supervised drug consumption room in Bern in 1986. ' +
      'Now operating 12+ facilities nationally. Users bring their own drugs and consume under ' +
      'medical supervision with access to clean equipment, naloxone, and referral to treatment. ' +
      'Part of the four-pillar drug policy.',
    yearImplemented: 1986,
    outcomes: [
      {
        metric: 'Overdose deaths on-site (total, 35+ years)',
        beforeValue: 0,
        afterValue: 0,
        changePercent: 0,
      },
      {
        metric: 'Drug-related deaths nationally (per million, 1990s→2020s)',
        beforeValue: 70,
        afterValue: 24,
        changePercent: -65.7,
      },
      {
        metric: 'New HIV infections among PWID (per year, peak→2020)',
        beforeValue: 600,
        afterValue: 30,
        changePercent: -95,
      },
      {
        metric: 'Neighborhood public drug use complaints (post-opening)',
        beforeValue: 100,
        afterValue: 40,
        changePercent: -60,
      },
    ],
    estimatedTransferability: 'high',
    adaptationNotes:
      'Supervised injection sites are now operating in 12+ countries including Canada, Australia, ' +
      'France, and Portugal. Legal frameworks vary (explicit legislation vs. prosecutorial discretion). ' +
      'Community engagement before opening is critical to avoid NIMBY opposition.',
    sources: [
      'EMCDDA. "Drug consumption rooms: an overview of provision and evidence." (2018)',
      'Potier, C. et al. "Supervised injection services: what has been demonstrated? A systematic literature review." Drug & Alcohol Dependence (2014)',
      'FOPH. Swiss Federal Office of Public Health. "Four pillar policy" overview.',
    ],
  },
  {
    name: 'Uruguay Cannabis Legalization',
    originCountry: 'Uruguay',
    category: 'Drug Policy',
    description:
      'In 2013, Uruguay became the first country to fully legalize the production, distribution, ' +
      'and consumption of recreational cannabis. Three access channels: pharmacy purchase (up to ' +
      '40g/month), home cultivation (up to 6 plants), or cannabis clubs (up to 99 plants). ' +
      'Institute for Regulation and Control of Cannabis (IRCCA) oversees the market.',
    yearImplemented: 2013,
    outcomes: [
      {
        metric: 'Black market share of cannabis consumption (%)',
        beforeValue: 100,
        afterValue: 35,
        changePercent: -65,
      },
      {
        metric: 'Cannabis use prevalence 15-64 (%)',
        beforeValue: 8.3,
        afterValue: 11.6,
        changePercent: 39.8,
      },
      {
        metric: 'Youth (15-17) cannabis use (%)',
        beforeValue: 8.5,
        afterValue: 8.2,
        changePercent: -3.5,
      },
      {
        metric: 'Cannabis-related arrests (per year)',
        beforeValue: 2700,
        afterValue: 400,
        changePercent: -85.2,
      },
    ],
    estimatedTransferability: 'medium',
    adaptationNotes:
      'State-regulated model (vs. commercial model) limits profit incentives for heavy marketing. ' +
      'Uruguay\'s small population (3.5M) made implementation simpler. International drug treaties ' +
      'remain a barrier for many countries. Pharmacy distribution model worth studying.',
    sources: [
      'Laqueur, H. et al. "The effects of cannabis legalization in Uruguay." International J. of Drug Policy (2020)',
      'IRCCA. Annual Reports 2020-2023.',
      'Transform Drug Policy Foundation. "How to Regulate Cannabis" (2016).',
    ],
  },
  {
    name: 'Singapore Public Housing (HDB)',
    originCountry: 'Singapore',
    category: 'Housing / Social Policy',
    description:
      'The Housing & Development Board (HDB) builds and manages public housing for ~80% of ' +
      'Singapore\'s population (90%+ homeownership within HDB). Flats sold on 99-year leases ' +
      'at subsidized prices. Ethnic integration policy prevents enclaves. CPF (pension) funds ' +
      'can be used for mortgage payments. Comprehensive town planning.',
    yearImplemented: 1960,
    outcomes: [
      {
        metric: 'Population in public housing (%)',
        beforeValue: 9,
        afterValue: 80,
        changePercent: 788.9,
      },
      {
        metric: 'Homeownership rate (%)',
        beforeValue: 29,
        afterValue: 89,
        changePercent: 206.9,
      },
      {
        metric: 'Squatter/slum population (%)',
        beforeValue: 70,
        afterValue: 0,
        changePercent: -100,
      },
      {
        metric: 'Gini coefficient (for housing costs)',
        beforeValue: 0.50,
        afterValue: 0.35,
        changePercent: -30,
      },
    ],
    estimatedTransferability: 'low',
    adaptationNotes:
      'Singapore\'s model relies on government land ownership (90% of land), compact city-state ' +
      'geography, CPF integration, and single-party political continuity. Elements transferable: ' +
      'ethnic integration quotas, public land banking, subsidized homeownership programs.',
    sources: [
      'Phang, S.Y. "The Singapore Model of Housing and the Welfare State." Research Collection School of Economics, SMU (2015)',
      'HDB Annual Report 2022/2023.',
      'Chua, B.H. "Liberalization & the Political Economy of Social Housing in Singapore." Urban Studies (2014)',
    ],
  },
  {
    name: 'Australia National Firearms Agreement (Gun Buyback)',
    originCountry: 'Australia',
    category: 'Public Safety',
    description:
      'After the Port Arthur massacre (35 dead, April 1996), Australia enacted the National ' +
      'Firearms Agreement within 12 days. Banned semi-automatic and pump-action shotguns/rifles, ' +
      'established national firearm registry, 28-day waiting period, and "genuine reason" requirement. ' +
      'Mandatory buyback collected ~660,000 firearms. Cost: AU$500 million.',
    yearImplemented: 1996,
    outcomes: [
      {
        metric: 'Mass shootings (5+ killed) in subsequent 25 years',
        beforeValue: 13,
        afterValue: 0,
        changePercent: -100,
      },
      {
        metric: 'Firearm homicide rate per 100K',
        beforeValue: 0.57,
        afterValue: 0.15,
        changePercent: -73.7,
      },
      {
        metric: 'Firearm suicide rate per 100K',
        beforeValue: 2.16,
        afterValue: 0.67,
        changePercent: -69,
      },
      {
        metric: 'Firearms collected in buyback',
        beforeValue: 0,
        afterValue: 660000,
        changePercent: 100,
      },
    ],
    estimatedTransferability: 'medium',
    adaptationNotes:
      'Success required bipartisan political will in the immediate aftermath of tragedy. ' +
      'Countries with constitutional right to bear arms (US 2nd Amendment) face unique legal barriers. ' +
      'Buyback economics vary by firearms prevalence. Cultural relationship with guns matters.',
    sources: [
      'Chapman, S. et al. "Australia\'s 1996 gun law reforms: faster falls in firearm deaths, firearm suicides, and a decade without mass shootings." Injury Prevention (2006)',
      'Leigh, A. & Neill, C. "Do Gun Buybacks Save Lives?" American Law & Economics Review (2010)',
      'Australian Institute of Criminology. "Firearms and violent crime." Trends & Issues (2020)',
    ],
  },
];

// ─── Utility Functions ───────────────────────────────────────────────────────

/**
 * Get policy exemplars by category.
 */
export function getExemplarsByCategory(category: string): PolicyExemplar[] {
  return POLICY_EXEMPLARS.filter(
    (p) => p.category.toLowerCase().includes(category.toLowerCase()),
  );
}

/**
 * Get policy exemplars by transferability rating.
 */
export function getExemplarsByTransferability(level: Transferability): PolicyExemplar[] {
  return POLICY_EXEMPLARS.filter((p) => p.estimatedTransferability === level);
}

/**
 * Get the total number of documented outcomes across all exemplars.
 */
export function getTotalOutcomeCount(): number {
  return POLICY_EXEMPLARS.reduce((sum, p) => sum + p.outcomes.length, 0);
}

/**
 * Get all unique categories.
 */
export function getExemplarCategories(): string[] {
  return [...new Set(POLICY_EXEMPLARS.map((p) => p.category))];
}
