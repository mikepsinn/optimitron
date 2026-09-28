/** Documented institutions in the 2017–2019 healthcare reference systems. */
export interface HealthcareReferencePolicy {
  name: string;
  description: string;
  url: string;
  periodNote: string;
}

export interface HealthcareReferencePolicies {
  countryId: string;
  countryName: string;
  policies: HealthcareReferencePolicy[];
}

/** These describe observed systems, not separately estimated policy effects. */
export const HEALTHCARE_REFERENCE_POLICIES: HealthcareReferencePolicies[] = [
  {
    countryId: 'JPN',
    countryName: 'Japan',
    policies: [
      {
        name: 'Universal insurance with a shared price schedule',
        description: 'Public insurance covers the population. A national fee schedule sets reimbursement prices across insurance plans and providers.',
        url: 'https://www.mhlw.go.jp/file/05-Shingikai-12601000-Seisakutoukatsukan-Sanjikanshitsu_Shakaihoshoutantou/0000083552.pdf',
        periodNote: 'Universal insurance dates to 1961; this ministry-hosted account predates the 2017–2019 comparison.',
      },
      {
        name: 'Income-based limits on large medical bills',
        description: 'High-cost medical benefits cap household copayments according to income and age, with extra protection for repeated expensive treatment.',
        url: 'https://www.mhlw.go.jp/wp/hakusyo/kousei/19-2/dl/02_en.pdf',
        periodNote: 'Described in the 2019 ministry report; its insurance-system table is dated April 2020. No current thresholds are assumed.',
      },
      {
        name: 'Payments that encourage generic medicines',
        description: 'The 2018 fee revision rewarded prescriptions using generic names and discouraged pharmacies with very low generic substitution.',
        url: 'https://www.oecd.org/en/publications/oecd-economic-surveys-japan-2019_fd63f374-en/full-report/component-6.html',
        periodNote: 'The 2018 revision occurred during the comparison period; its separate effect on national outcomes is not estimated.',
      },
    ],
  },
  {
    countryId: 'KOR',
    countryName: 'South Korea',
    policies: [
      {
        name: 'One national insurance pool',
        description: 'National Health Insurance combines employment and regional insurance in one insurer, pooling contributions and purchasing covered care nationally.',
        url: 'https://www.nhis.or.kr/english/wbheaa01300m01.do',
        periodNote: 'Insurers merged in 2000; employment and regional finances were integrated in 2003.',
      },
      {
        name: 'National claims review and quality assessment',
        description: 'HIRA reviews medical claims, assesses care quality and checks medication use through a national review system.',
        url: 'https://www.hira.or.kr/eng/news/01/__icsFiles/afieldfile/2012/04/29/2011_HIRA_Brochure.pdf',
        periodNote: 'Documented in HIRA’s 2011 institutional report, before the comparison period.',
      },
      {
        name: 'Bundled payments for selected procedures',
        description: 'Diagnosis-related payments cover seven disease groups, replacing separate charges for each service within those covered admissions.',
        url: 'https://www.nhis.or.kr/english/wbheaa01300m01.do',
        periodNote: 'NHIS records compulsory DRG payments for seven groups from 2012; this is not a claim that all care uses bundled payment.',
      },
    ],
  },
  {
    countryId: 'SGP',
    countryName: 'Singapore',
    policies: [
      {
        name: 'Subsidised care plus lifelong insurance',
        description: 'Public institutions provide subsidised care. MediShield Life pools the risk of large hospital bills and selected costly outpatient treatment.',
        url: 'https://www.moh.gov.sg/newsroom/medishield-life-coverage/',
        periodNote: 'MediShield Life began in 2015; this January 2019 ministry statement describes the comparison-period system.',
      },
      {
        name: 'Medical savings for remaining bills',
        description: 'MediSave balances can pay eligible costs left after subsidies and insurance. These savings are still part of the resources healthcare consumes.',
        url: 'https://www.moh.gov.sg/newsroom/medishield-life-coverage/',
        periodNote: 'Described in the January 2019 ministry statement; savings are not treated as free healthcare in the cost comparison.',
      },
      {
        name: 'A fund for patients who cannot afford care',
        description: 'MediFund and institutional financial assistance help patients who still face financial difficulty after subsidies, insurance and medical savings.',
        url: 'https://www.moh.gov.sg/newsroom/medishield-life-coverage/',
        periodNote: 'Described in the January 2019 ministry statement.',
      },
    ],
  },
];
