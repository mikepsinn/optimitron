import { GameCTA } from "@/components/ui/game-cta";
import { ArcadeTag } from "@/components/ui/arcade-tag";
import { ItemCard, type ItemCardProps } from "@/components/ui/item-card";
import { ARMORY } from "@/lib/messaging";
import {
  prizeLink,
  wishocracyLink,
  alignmentLink,
  studiesLink,
  referendumLink,
  iabLink,
  dtreasuryLink,
  scoreboardLink,
  trackLink,
  budgetLink,
  policiesLink,
  toolsLink,
} from "@/lib/routes";
import { getRouteMetadata } from "@/lib/metadata";

export const metadata = getRouteMetadata(toolsLink);

/* ------------------------------------------------------------------ */
/*  Shelf: a category of items (Weapons, Scrolls, Gold, Seals, Potions) */
/* ------------------------------------------------------------------ */

interface Shelf {
  icon: string;
  heading: string;
  subtitle: string;
  color: "cyan" | "yellow" | "pink" | "background";
  items: Omit<ItemCardProps, "className">[];
}

const shelves: Shelf[] = [
  /* ── WEAPONS ── */
  {
    icon: ARMORY.shelves.weapons.icon,
    heading: ARMORY.shelves.weapons.heading,
    subtitle: ARMORY.shelves.weapons.subtitle,
    color: "cyan",
    items: [
      {
        name: "The Optimizer",
        icon: "⚔️",
        rarity: "legendary",
        description:
          "Give it two time series. It tells you what causes what. Your scientists take 12 years. This takes seconds.",
        stats: [
          { label: "IMPACT", value: 8 },
          { label: "REACH", value: 10 },
          { label: "SPEED", value: 9 },
        ],
        cost: "FREE",
        link: { item: studiesLink, label: "Equip" },
        bgColor: "cyan",
      },
      {
        name: "Policy Generator",
        icon: "📜",
        rarity: "legendary",
        description:
          "Ranks every policy by what actually happened when someone tried it. Not by who proposed it. Not by how it sounds.",
        stats: [
          { label: "IMPACT", value: 9 },
          { label: "REACH", value: 8 },
          { label: "SPEED", value: 7 },
        ],
        cost: "FREE",
        link: { item: policiesLink, label: "Equip" },
        bgColor: "cyan",
      },
      {
        name: "Budget Generator",
        icon: "⚖️",
        rarity: "epic",
        description:
          "Finds the spending level where each additional dollar stops helping. Diminishing returns modelling. Your government has never done this.",
        stats: [
          { label: "IMPACT", value: 9 },
          { label: "REACH", value: 7 },
          { label: "SPEED", value: 6 },
        ],
        cost: "FREE",
        link: { item: budgetLink, label: "Equip" },
        bgColor: "cyan",
      },
      {
        name: "Cross-Realm Map",
        icon: "🗺️",
        rarity: "epic",
        description:
          "Every country is a natural experiment. Compare spending, policies, and outcomes across 100+ jurisdictions. No need to guess when you can just look.",
        stats: [
          { label: "IMPACT", value: 7 },
          { label: "REACH", value: 10 },
          { label: "SPEED", value: 8 },
        ],
        cost: "FREE",
        link: { item: studiesLink, label: "Equip" },
        bgColor: "cyan",
      },
      {
        name: "Decentralized Apothecary",
        icon: "⚗️",
        rarity: "legendary",
        description:
          "Competing trial platforms. 2% of the cost. 44x the speed. Real patients, real conditions, real data. Your FDA takes 8.2 years AFTER a treatment is proven safe.",
        stats: [
          { label: "IMPACT", value: 10 },
          { label: "SPEED", value: 10 },
          { label: "COST", value: 2 },
        ],
        cost: "FREE",
        externalLink: { href: "https://dfda.earth", label: "Equip" },
        bgColor: "cyan",
      },
      {
        name: "Institute of Healing",
        icon: "🏛️",
        rarity: "epic",
        description:
          "Thin coordination layer allocating $27.2B/yr from the 1% Treaty via democratic voting. You decide where the money goes. Not a committee.",
        stats: [
          { label: "IMPACT", value: 10 },
          { label: "REACH", value: 9 },
          { label: "SPEED", value: 5 },
        ],
        cost: "FREE",
        externalLink: { href: "https://dih.earth", label: "Equip" },
        bgColor: "cyan",
      },
    ],
  },

  /* ── SCROLLS ── */
  {
    icon: ARMORY.shelves.scrolls.icon,
    heading: ARMORY.shelves.scrolls.heading,
    subtitle: ARMORY.shelves.scrolls.subtitle,
    color: "yellow",
    items: [
      {
        name: "Wishocracy",
        icon: "📯",
        rarity: "legendary",
        description:
          "Pick between two things, ten times. Eigenvector decomposition produces a stable budget allocation. Two minutes. Done. Democracy without the screaming.",
        stats: [
          { label: "VOICE", value: 10 },
          { label: "REACH", value: 9 },
          { label: "SPEED", value: 10 },
        ],
        cost: "2 MIN",
        link: { item: wishocracyLink, label: "Equip" },
        bgColor: "yellow",
      },
      {
        name: "Alignment Crystal",
        icon: "🔮",
        rarity: "epic",
        description:
          "Compare politician voting records against citizen preferences. Make alignment visible and undeniable. Most people are surprised. Not pleasantly.",
        stats: [
          { label: "VOICE", value: 8 },
          { label: "REACH", value: 7 },
          { label: "TRUTH", value: 10 },
        ],
        cost: "FREE",
        link: { item: alignmentLink, label: "Equip" },
        bgColor: "yellow",
      },
      {
        name: "Treaty Gauntlet",
        icon: "✊",
        rarity: "rare",
        description:
          "Redirect 1% of military spending to pragmatic clinical trials. Verified via World ID. Every verified vote earns the recruiter a VOTE point.",
        stats: [
          { label: "VOICE", value: 10 },
          { label: "REACH", value: 10 },
          { label: "SPEED", value: 8 },
        ],
        cost: "WORLD ID",
        link: { item: referendumLink, label: "Equip" },
        bgColor: "yellow",
      },
    ],
  },

  /* ── GOLD & LOOT ── */
  {
    icon: ARMORY.shelves.gold.icon,
    heading: ARMORY.shelves.gold.heading,
    subtitle: ARMORY.shelves.gold.subtitle,
    color: "pink",
    items: [
      {
        name: "Earth Optimization Game",
        icon: "🎰",
        rarity: "legendary",
        description:
          "Deposit. Recruit. Win or get ~11x back. The only game where the house always loses.",
        stats: [
          { label: "YIELD", value: 9 },
          { label: "IMPACT", value: 10 },
          { label: "RISK", value: 0 },
        ],
        cost: "$100+ USDC",
        link: { item: prizeLink, label: "Equip" },
        bgColor: "pink",
      },
      {
        name: "Earth Optimization Prize Fund",
        icon: "🏆",
        rarity: "epic",
        description:
          "Venture-grade returns (17.4% annually) without the 2-and-20 fees. Crowd-allocated via Wishocratic preference aggregation. Beats conventional retirement by 3x.",
        stats: [
          { label: "YIELD", value: 8 },
          { label: "IMPACT", value: 7 },
          { label: "RISK", value: 2 },
        ],
        cost: "VARIABLE",
        link: { item: scoreboardLink, label: "Equip" },
        bgColor: "pink",
      },
      {
        name: "Incentive Alignment Bonds",
        icon: "📜",
        rarity: "rare",
        description:
          "Phase 2: after demand is proven. Raise ~$1B to lobby for the treaty. Revenue splits 80/10/10. Smart contract enforced. No trust required.",
        stats: [
          { label: "YIELD", value: 7 },
          { label: "IMPACT", value: 10 },
          { label: "RISK", value: 3 },
        ],
        cost: "USDC",
        link: { item: iabLink, label: "Equip" },
        locked: true,
        lockReason: "Unlocks after referendum threshold",
        bgColor: "pink",
      },
      {
        name: "$WISH Token",
        icon: "🪙",
        rarity: "legendary",
        description:
          "0.5% transaction tax replaces the IRS. UBI eliminates poverty. Algorithmic 0% inflation stops the inflationary theft funding war.",
        stats: [
          { label: "IMPACT", value: 10 },
          { label: "REACH", value: 10 },
          { label: "SPEED", value: 3 },
        ],
        cost: "FREE",
        link: { item: dtreasuryLink, label: "Equip" },
        bgColor: "pink",
      },
      {
        name: "Campaign Golem",
        icon: "⚙️",
        rarity: "rare",
        description:
          "Smart contracts route funds to politicians based on alignment scores. Vote with citizens? Get funded. Vote against them? Don't.",
        stats: [
          { label: "IMPACT", value: 8 },
          { label: "REACH", value: 6 },
          { label: "SPEED", value: 9 },
        ],
        cost: "FREE",
        locked: true,
        lockReason: "Unlocks after alignment scoring is live",
        bgColor: "pink",
      },
    ],
  },

  /* ── SEALS & WARDS ── */
  {
    icon: ARMORY.shelves.seals.icon,
    heading: ARMORY.shelves.seals.heading,
    subtitle: ARMORY.shelves.seals.subtitle,
    color: "background",
    items: [
      {
        name: "Hypercerts",
        icon: "🛡️",
        rarity: "rare",
        description:
          "Verifiable impact attestations on AT Protocol. Referral recruitment, alignment scores, prize pool deposits — permanently published and auditable on Bluesky.",
        stats: [
          { label: "TRUST", value: 10 },
          { label: "PERM", value: 10 },
        ],
        cost: "FREE",
        bgColor: "background",
      },
      {
        name: "Policy Analyst Familiar",
        icon: "🤖",
        rarity: "epic",
        description:
          "AI agent that continuously generates impact analyses, scores policies, and updates Hypercerts. Works while you sleep. Doesn't need coffee.",
        stats: [
          { label: "TRUST", value: 8 },
          { label: "SPEED", value: 10 },
        ],
        cost: "FREE",
        bgColor: "background",
      },
    ],
  },

  /* ── POTIONS ── */
  {
    icon: ARMORY.shelves.potions.icon,
    heading: ARMORY.shelves.potions.heading,
    subtitle: ARMORY.shelves.potions.subtitle,
    color: "cyan",
    items: [
      {
        name: "Talk to Wishonia",
        icon: "🧪",
        rarity: "rare",
        description:
          "Health tracking with an alien who's been at this for 4,237 years. She'll tell you what's actually working. Your intuition won't like it.",
        stats: [
          { label: "INSIGHT", value: 8 },
          { label: "SASS", value: 10 },
        ],
        cost: "FREE",
        link: { item: trackLink, label: "Equip" },
        bgColor: "cyan",
      },
      {
        name: "Digital Twin Armor",
        icon: "🔒",
        rarity: "uncommon",
        description:
          "Chrome extension for personal data sovereignty. Your health data, your meals, your sleep — your encrypted vault. Share what you want.",
        stats: [
          { label: "PRIVACY", value: 10 },
          { label: "CONTROL", value: 10 },
        ],
        cost: "FREE",
        bgColor: "cyan",
      },
    ],
  },
];

const totalItems = shelves.reduce((sum, s) => sum + s.items.length, 0);

/* ------------------------------------------------------------------ */
/*  Shelf color → section bg mapping                                   */
/* ------------------------------------------------------------------ */

const shelfBgClasses: Record<Shelf["color"], string> = {
  cyan: "bg-muted",
  yellow: "bg-muted",
  pink: "bg-muted",
  background: "bg-background",
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ArmoryPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="mb-16 space-y-3">
        <ArcadeTag>{ARMORY.itemCount(totalItems)}</ArcadeTag>
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-foreground">
          {ARMORY.pageTitle}
        </h1>
        <p className="max-w-3xl text-lg font-bold text-muted-foreground">
          {ARMORY.shopkeeperGreeting}
        </p>
      </section>

      {/* Shelves */}
      {shelves.map((shelf) => (
        <section key={shelf.heading} className="mb-16">
          {/* Shelf header */}
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{shelf.icon}</span>
            <h2 className="text-2xl font-black uppercase tracking-tight text-foreground">
              {shelf.heading}
            </h2>
          </div>
          <p className="text-sm font-bold text-muted-foreground mb-6 ml-10">
            {shelf.subtitle}
          </p>

          {/* Item grid */}
          <div
            className={`grid grid-cols-1 md:grid-cols-2 gap-6 p-4 -mx-4 rounded-md ${shelfBgClasses[shelf.color]}`}
          >
            {shelf.items.map((item) => (
              <ItemCard key={item.name} {...item} />
            ))}
          </div>
        </section>
      ))}

      {/* Final CTA — Shopkeeper farewell */}
      <section className="border-4 border-primary bg-brutal-pink text-brutal-pink-foreground p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
        <h2 className="text-2xl font-black mb-3 uppercase font-pixel">
          Still Browsing?
        </h2>
        <p className="mb-6 font-bold max-w-2xl mx-auto">
          {ARMORY.shopkeeperFooter}
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <GameCTA href="/prize">Play the Game</GameCTA>
          <GameCTA href="/scoreboard" variant="outline">
            View Scoreboard
          </GameCTA>
        </div>
      </section>
    </div>
  );
}
