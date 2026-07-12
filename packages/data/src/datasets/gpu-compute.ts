/**
 * GPU market snapshot for the /compute basement-rig calculator.
 *
 * Hand-curated from public listings and trackers on the asOf dates below.
 * Used prices are RANGES because trackers disagree (2026 has a documented
 * supply squeeze; some cards trade above their launch MSRP). Every number
 * carries its source URL so a reader can re-check the market in one click.
 */

export interface GpuComputeCard {
  id: string;
  name: string;
  vramGb: number;
  tdpWatts: number;
  /** Launch MSRP in USD; null for datacenter cards NVIDIA never priced publicly. */
  launchMsrpUsd: number | null;
  msrpNote?: string;
  usedPriceLowUsd: number;
  usedPriceHighUsd: number;
  usedPriceSourceUrl: string;
  usedPriceAsOf: string;
  /** Decentralized-marketplace rental band, USD per card-hour. */
  rentalLowPerHourUsd: number;
  rentalHighPerHourUsd: number;
  rentalSourceUrl: string;
  ebaySearchUrl: string;
  /** What this single card runs locally at 4-bit quantization. */
  runsLocally: string;
}

export const GPU_COMPUTE_CARDS: GpuComputeCard[] = [
  {
    id: 'rtx-3090',
    name: 'RTX 3090 (used)',
    vramGb: 24,
    tdpWatts: 350,
    launchMsrpUsd: 1499,
    usedPriceLowUsd: 1000,
    usedPriceHighUsd: 1750,
    usedPriceSourceUrl: 'https://resaleprices.com/gpu/nvidia-rtx-3090',
    usedPriceAsOf: '2026-07-12',
    rentalLowPerHourUsd: 0.13,
    rentalHighPerHourUsd: 0.46,
    rentalSourceUrl: 'https://vast.ai/pricing/gpu/RTX-3090',
    ebaySearchUrl: 'https://www.ebay.com/sch/i.html?_nkw=RTX+3090+24GB',
    runsLocally: 'Qwen3 30B-class assistants at 4-bit. Capable, not frontier.',
  },
  {
    id: 'rtx-4090',
    name: 'RTX 4090 (used)',
    vramGb: 24,
    tdpWatts: 450,
    launchMsrpUsd: 1599,
    msrpNote:
      'Production ended Oct 2024; new-in-box units sell ~70% above launch MSRP as of July 2026.',
    usedPriceLowUsd: 1800,
    usedPriceHighUsd: 2300,
    usedPriceSourceUrl:
      'https://howmuch.one/product/average-nvidia-geforce-rtx-4090-24gb/price-history',
    usedPriceAsOf: '2026-07-12',
    rentalLowPerHourUsd: 0.35,
    rentalHighPerHourUsd: 0.69,
    rentalSourceUrl: 'https://vast.ai/pricing/gpu/RTX-4090',
    ebaySearchUrl: 'https://www.ebay.com/sch/i.html?_nkw=RTX+4090+24GB',
    runsLocally: 'Qwen3 30B-class at 4-bit, faster. Still not frontier.',
  },
  {
    id: 'rtx-5090',
    name: 'RTX 5090 (used)',
    vramGb: 32,
    tdpWatts: 575,
    launchMsrpUsd: 1999,
    msrpNote: 'Trades well above MSRP amid the 2026 supply squeeze.',
    usedPriceLowUsd: 2700,
    usedPriceHighUsd: 4000,
    usedPriceSourceUrl:
      'https://www.pcprice.watch/gpu-buying-guide/rtx-5090-price-used-and-specs',
    usedPriceAsOf: '2026-07-12',
    rentalLowPerHourUsd: 0.4,
    rentalHighPerHourUsd: 0.99,
    rentalSourceUrl: 'https://vast.ai/pricing/gpu/RTX-5090',
    ebaySearchUrl: 'https://www.ebay.com/sch/i.html?_nkw=RTX+5090+32GB',
    runsLocally: '32B-class models with long context at 4-bit.',
  },
  {
    id: 'rtx-6000-ada',
    name: 'RTX 6000 Ada (used)',
    vramGb: 48,
    tdpWatts: 300,
    launchMsrpUsd: 7350,
    usedPriceLowUsd: 5300,
    usedPriceHighUsd: 5600,
    usedPriceSourceUrl: 'https://www.ebay.com/sch/i.html?_nkw=RTX+6000+Ada+48GB',
    usedPriceAsOf: '2026-07-12',
    rentalLowPerHourUsd: 0.53,
    rentalHighPerHourUsd: 0.77,
    rentalSourceUrl: 'https://vast.ai/pricing/gpu/RTX-6000ADA',
    ebaySearchUrl: 'https://www.ebay.com/sch/i.html?_nkw=RTX+6000+Ada+48GB',
    runsLocally: '70B-dense class at 4-bit; Llama 4 Scout just misses.',
  },
  {
    id: 'rtx-pro-6000',
    name: 'RTX PRO 6000 Blackwell 96GB',
    vramGb: 96,
    tdpWatts: 600,
    launchMsrpUsd: 8565,
    msrpNote:
      'NVIDIA raised list price to $13,250 within 16 months of launch — a 55% hike on a card already shipping.',
    usedPriceLowUsd: 11000,
    usedPriceHighUsd: 13000,
    usedPriceSourceUrl:
      'https://mlq.ai/news/nvidia-raises-rtx-pro-6000-blackwell-msrp-to-13250-a-55-hike-in-one-year/',
    usedPriceAsOf: '2026-07-12',
    rentalLowPerHourUsd: 1.0,
    rentalHighPerHourUsd: 1.99,
    rentalSourceUrl: 'https://vast.ai/pricing/gpu/RTX-PRO-6000-WS',
    ebaySearchUrl:
      'https://www.ebay.com/sch/i.html?_nkw=RTX+PRO+6000+Blackwell+96GB',
    runsLocally: 'Llama 4 Scout comfortably; the building block for frontier rigs.',
  },
  {
    id: 'a100-80gb',
    name: 'A100 80GB (used)',
    vramGb: 80,
    tdpWatts: 300,
    launchMsrpUsd: null,
    msrpNote: 'NVIDIA never published datacenter MSRPs; launch-era reseller price ~$15,000+.',
    usedPriceLowUsd: 6000,
    usedPriceHighUsd: 10000,
    usedPriceSourceUrl:
      'https://hashrateindex.com/blog/used-gpu-market-pricing-deprecation-secondary-ai/',
    usedPriceAsOf: '2026-07-12',
    rentalLowPerHourUsd: 0.53,
    rentalHighPerHourUsd: 1.39,
    rentalSourceUrl: 'https://vast.ai/pricing/gpu/A100-PCIE',
    ebaySearchUrl: 'https://www.ebay.com/sch/i.html?_nkw=NVIDIA+A100+80GB',
    runsLocally: '70B-dense class at 4-bit with real context headroom.',
  },
  {
    id: 'h100-80gb',
    name: 'H100 80GB (used)',
    vramGb: 80,
    tdpWatts: 350,
    launchMsrpUsd: null,
    msrpNote: 'No official MSRP; 2023 OEM list estimated $28,000+.',
    usedPriceLowUsd: 15000,
    usedPriceHighUsd: 28000,
    usedPriceSourceUrl: 'https://www.ebay.com/sch/i.html?_nkw=NVIDIA+H100+80GB',
    usedPriceAsOf: '2026-07-12',
    rentalLowPerHourUsd: 1.73,
    rentalHighPerHourUsd: 2.99,
    rentalSourceUrl: 'https://vast.ai/pricing/gpu/H100-SXM',
    ebaySearchUrl: 'https://www.ebay.com/sch/i.html?_nkw=NVIDIA+H100+80GB',
    runsLocally: 'Same class as A100, roughly 2-3x the speed.',
  },
];

export interface GpuRigTier {
  label: string;
  pooledVramGb: number;
  runs: string;
}

/** What pooled VRAM buys you in mid-2026 open-weight models (4-bit weights). */
export const GPU_RIG_TIERS: GpuRigTier[] = [
  {
    label: '1× 24 GB',
    pooledVramGb: 24,
    runs: 'Qwen3 30B-class assistants. A sharp research aide, not a professor.',
  },
  {
    label: '1× 48 GB',
    pooledVramGb: 48,
    runs: '70B-dense class. Solid graduate student.',
  },
  {
    label: '1× 96 GB',
    pooledVramGb: 96,
    runs: 'Llama 4 Scout with headroom. Adjunct professor.',
  },
  {
    label: '4× 96 GB',
    pooledVramGb: 384,
    runs: 'GLM-4.5, Qwen3-235B, Llama 4 Maverick. Tenured professor.',
  },
  {
    label: '8× 96 GB',
    pooledVramGb: 768,
    runs: 'GLM-5.2 at full context; DeepSeek-V3-class. A small faculty.',
  },
];

/**
 * Macro numbers behind the supply-demand gap argument. Sourced 2026-07-12;
 * every figure links to where it can be re-checked.
 */
export const GPU_COMPUTE_MACRO = {
  /** METR Time Horizon 1.1 (Jan 2026): task-length doubling since 2024. */
  aiTaskDoublingDays: {
    value: 89,
    window: 'since 2024',
    sourceUrl: 'https://metr.org/blog/2026-1-29-time-horizon-1-1/',
    asOf: '2026-01-29',
  },
  /** Same release, longer window — cite alongside, the rate is accelerating. */
  aiTaskDoublingDaysSince2023: {
    value: 131,
    window: 'since 2023',
    sourceUrl: 'https://metr.org/blog/2026-1-29-time-horizon-1-1/',
    asOf: '2026-01-29',
  },
  /** TSMC CoWoS advanced packaging, ~35k -> ~130k wafers/mo late-2024 to end-2026. */
  gpuSupplyDoublingMonths: {
    low: 12,
    high: 13,
    sourceUrl:
      'https://www.trendforce.com/news/2026/06/15/news-tsmc-cowos-supply-demand-gap-reportedly-seen-narrowing-from-20-to-10-by-end-2026-as-capacity-expands/',
    asOf: '2026-06-15',
  },
  /** EIA Electric Power Monthly, Table 5.6.A, April 2026 US residential average. */
  usResidentialElectricityUsdPerKwh: {
    value: 0.1883,
    sourceUrl:
      'https://www.eia.gov/electricity/monthly/epm_table_grapher.php?t=epmt_5_6_a',
    asOf: '2026-04',
  },
} as const;
