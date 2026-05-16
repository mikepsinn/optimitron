import Link from "next/link";
import { BrutalCard } from "@/components/ui/brutal-card";
import { ArcadeTag } from "@/components/ui/arcade-tag";
import { GameCTA } from "@/components/ui/game-cta";
import { agenciesLink, getWishoniaAgencyPath } from "@/lib/routes";
import { getRouteMetadata } from "@/lib/metadata";
import {
  getAgenciesByDepartment,
  WISHONIA_AGENCIES,
} from "@optimitron/data/datasets/wishonia-agencies";

export const metadata = getRouteMetadata(agenciesLink);

const departments = getAgenciesByDepartment();
const totalAgencies = WISHONIA_AGENCIES.length;

export default function AgenciesIndexPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="mb-16">
        <div className="max-w-3xl space-y-5">
          <ArcadeTag>{totalAgencies} Agencies</ArcadeTag>
          <h1 className="text-3xl font-black uppercase tracking-tight text-foreground md:text-5xl">
            Optimized Governance
          </h1>
          <p className="text-lg font-bold leading-relaxed text-foreground">
            On my planet, governance takes about four minutes a week.
            {" "}
            {totalAgencies}
            {" "}
            optimized agencies handle money, audits, housing, justice,
            education, environment, and the bits your species currently staffs
            with queues, waivers, and lobbyists.
          </p>
          <p className="font-bold leading-relaxed text-muted-foreground">
            Your species has hundreds of federal agencies. Most of them exist to
            manage the failures of other agencies. Here is what a compact
            civilization-grade replacement map looks like.
          </p>
        </div>
      </section>

      {departments.map((dept) => (
        <section key={dept.label} className="mb-12">
          <h2 className="mb-6 text-xl font-black uppercase tracking-tight text-foreground">
            {dept.label}
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {dept.agencies.map((agency) => (
              <Link
                key={agency.id}
                href={getWishoniaAgencyPath(agency.id)}
                className="block"
              >
                <BrutalCard
                  bgColor={agency.cardColor}
                  hover
                  padding="lg"
                  className="h-full"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-3xl">{agency.emoji}</span>
                    <span className="inline-block border border-foreground bg-background px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.1em] text-foreground">
                      Active
                    </span>
                  </div>
                  <h3 className="mt-2 text-xl font-black uppercase text-foreground">
                    {agency.dName}
                  </h3>
                  <p className="mt-2 text-sm font-bold leading-relaxed text-foreground">
                    {agency.tagline}
                  </p>
                  <p className="mt-3 text-xs font-black uppercase text-muted-foreground">
                    On Earth: {agency.replacesAgencyName}
                  </p>
                </BrutalCard>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <section className="border border-foreground bg-background p-8 text-center text-foreground">
        <h2 className="mb-3 text-2xl font-black uppercase">
          See How Earth Does It
        </h2>
        <p className="mx-auto mb-6 max-w-2xl text-lg font-bold opacity-80">
          Every Earth government graded on spending vs outcomes. We publish the
          results the same way you publish restaurant hygiene ratings. Except
          you actually read those.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <GameCTA href="/governments" variant="primary" size="lg">
            Government Report Cards
          </GameCTA>
          <GameCTA href="/agencies/dcongress/wishocracy" variant="yellow" size="lg">
            Play the Game
          </GameCTA>
        </div>
      </section>
    </div>
  );
}
