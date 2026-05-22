import { VotePosition } from "@optimitron/db";
import {
  ANNUAL_TERRORISM_DEATH_RISK_DENOMINATOR,
  DEFENSE_LOBBYING_ANNUAL,
  DEFENSE_SECTOR_RETENTION_PCT,
  PENTAGON_UNACCOUNTED_FUNDS,
  POST_WW2_MILITARY_CUT_PCT,
  SHIRT_SEED_WEARERS_THRESHOLD,
  TREATY_CAMPAIGN_BUDGET_LOBBYING,
  TREATY_TRAJECTORY_GDP_VS_CURRENT_TRAJECTORY_MULTIPLIER_YEAR_15,
  US_1939_MILITARY_SPENDING_PCT_LOWER_THAN_CURRENT,
} from "@optimitron/data/parameters";
import { getServerSession } from "next-auth";
import Link from "next/link";
import type { ReactNode } from "react";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { authOptions } from "@/lib/auth";
import { WAR_ON_DISEASE_CANONICAL_ORIGIN } from "@/lib/domains";
import { SHIRT_BACK_COPY_LINES, SHIRT_FRONT_COPY } from "@/lib/messaging";
import { getRouteMetadata } from "@/lib/metadata";
import { prisma } from "@/lib/prisma";
import { getHandleOrReferralCode } from "@/lib/referral.client";
import { jokeLink, ROUTES } from "@/lib/routes";
import { TREATY_REFERENDUM_SLUG } from "@/lib/treaty";
import { buildReferralUrl } from "@/lib/url";

const stepHeadingClass =
  "text-4xl font-black uppercase leading-none sm:text-5xl md:text-6xl";
const paragraphClass = "text-lg font-bold leading-8 text-foreground";
const manualBase = "https://manual.warondisease.org/knowledge";

export const metadata = getRouteMetadata(jokeLink);

async function getPersonalReferralUrl() {
  const session = await getServerSession(authOptions);
  const referralIdentifier = getHandleOrReferralCode(session?.user);

  if (!session?.user?.id || !referralIdentifier) {
    return null;
  }

  const yesVote = await prisma.referendumVote.findFirst({
    where: {
      answer: VotePosition.YES,
      deletedAt: null,
      referendum: {
        deletedAt: null,
        slug: TREATY_REFERENDUM_SLUG,
      },
      userId: session.user.id,
    },
    select: { id: true },
  });

  if (!yesVote) {
    return null;
  }

  return buildReferralUrl(referralIdentifier, WAR_ON_DISEASE_CANONICAL_ORIGIN);
}

function StepHeading({ children }: { children: ReactNode }) {
  return <h2 className={stepHeadingClass}>{children}</h2>;
}

function Objection({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <details className="border border-foreground bg-background">
      <summary className="cursor-pointer list-none p-4">
        <h3 className="text-xl font-black leading-tight sm:text-2xl">
          {title}
        </h3>
      </summary>
      <div className="space-y-5 border-t border-foreground p-4">{children}</div>
    </details>
  );
}

function ManualLink({ children, href }: { children: ReactNode; href: string }) {
  return (
    <a className="underline underline-offset-4" href={href}>
      {children}
    </a>
  );
}

export default async function JokePage() {
  const personalReferralUrl = await getPersonalReferralUrl();
  const shirtReferralUrl =
    personalReferralUrl ?? "warondisease.org/<your referral code>";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="space-y-6 border-b border-foreground pb-10">
          <h1 className="text-5xl font-black uppercase leading-none sm:text-6xl md:text-7xl">
            THE FUNNIEST JOKE IN THE UNIVERSE
          </h1>
          <p className="text-2xl font-black leading-tight">
            How to end war and disease through vandalism.
          </p>
          <p className={paragraphClass}>
            We report the discovery and proof of the funniest joke in the
            history of the universe. The joke takes the form of a t-shirt.
          </p>
        </section>

        <section className="space-y-6 border-b border-foreground py-10">
          <StepHeading>STEP 1 — VOTE ON THIS.</StepHeading>
          <p className={paragraphClass}>
            The risk we are protecting against is small: your annual chance of
            dying in a terrorist attack is about 1 in{" "}
            <ParameterValue param={ANNUAL_TERRORISM_DEATH_RISK_DENOMINATOR} />.
            The risk we are not protecting against is enormous: your lifetime
            chance of suffering and dying from a disease is approximately 100%.
            The current spending ratio funds the smaller risk at the expense of
            the larger one. The shirt is asking you to notice.
          </p>
          <Link
            className="inline-flex border border-foreground bg-foreground px-5 py-3 text-base font-black uppercase text-background hover:bg-background hover:text-foreground"
            href={ROUTES.vote}
          >
            VOTE YES ON THE 1% TREATY
          </Link>
        </section>

        <section className="space-y-6 border-b border-foreground py-10">
          <StepHeading>STEP 2 — GET A PERMANENT MARKER.</StepHeading>
          <p className={paragraphClass}>
            You can buy one. You can also take a permanent marker and write it
            on a shirt you already own. Either works. The shirt is text. Text
            costs $0.50 of ink.
          </p>
        </section>

        <section className="space-y-6 border-b border-foreground py-10">
          <StepHeading>
            STEP 3 — SNEAK INTO THE CLOSETS OF EVERYONE YOU LOVE.
          </StepHeading>
          <p className={paragraphClass}>
            Take a permanent marker into the closet of every human you do not
            want to suffer and die of preventable disease. Your spouse. Your
            siblings. Your parents. The parents of your children&apos;s friends.
            Write <em>this t-shirt ended war and disease</em> on the front.
            Write{" "}
            <em>
              trade one apocalypse for disease eradication at warondisease.org
            </em>{" "}
            and your referral code on the back. They will notice when they put
            the shirt on. They will demand an explanation. You hand them this
            paper. They explain it to the next human who asks them. The chain
            propagates.
          </p>
        </section>

        <section className="space-y-8 border-b border-foreground py-10">
          <StepHeading>STEP 4 — WRITE THIS ON THEIR SHIRTS.</StepHeading>
          <div className="grid gap-6 md:grid-cols-2">
            <section className="border border-foreground p-5">
              <h3 className="text-3xl font-black uppercase leading-tight">
                FRONT:
              </h3>
              <p className="mt-4 text-4xl font-black uppercase leading-none sm:text-5xl">
                {SHIRT_FRONT_COPY}
              </p>
            </section>
            <section className="border border-foreground p-5">
              <h3 className="text-3xl font-black uppercase leading-tight">
                BACK:
              </h3>
              <p className="mt-4 text-3xl font-black uppercase leading-tight sm:text-4xl">
                {SHIRT_BACK_COPY_LINES.join(" ")}
              </p>
              <p className="mt-4 break-words text-xl font-black leading-tight sm:text-2xl">
                {shirtReferralUrl}
              </p>
              {!personalReferralUrl ? (
                <p className="mt-4 text-base font-bold leading-7">
                  Sign in and vote yes to get your real referral link printed
                  here.
                </p>
              ) : null}
            </section>
          </div>
          <p className={paragraphClass}>
            The prank also solves the friction problem from the recipient&apos;s
            side. A human wearing &quot;End War &amp; Disease&quot; on their own
            initiative is making a political declaration, which is the socially
            exposing version. A human wearing it because their spouse defaced
            their entire closet last Tuesday is just a human with a funny story.
            The cost of explaining the shirt drops from &quot;I am
            advocating&quot; to &quot;you won&apos;t believe what
            happened,&quot; which is the conversation humans actually like
            having.
          </p>
        </section>

        <section className="space-y-6 border-b border-foreground py-10">
          <StepHeading>
            STEP 5 — WHEN THEY GET MAD AT YOU, ANSWER THESE QUESTIONS.
          </StepHeading>
          <p className={paragraphClass}>
            When you wear the shirt, humans will ask you about it. They will
            raise objections in roughly this order. Memorize the answers. You
            are the delivery mechanism.
          </p>
          <div className="space-y-4">
            <Objection title='"But we need the military budget!"'>
              <p className={paragraphClass}>
                The treaty takes 1%. You keep{" "}
                <ParameterValue param={DEFENSE_SECTOR_RETENTION_PCT} />. Every
                nation reduces by the same amount, so relative military balance
                stays exactly the same. You each have 1% fewer missiles pointed
                at each other. Every sane observer calls this &quot;safer.&quot;
                Your species calls it &quot;an unacceptable risk to national
                security.&quot; Same math, different feelings.
              </p>
              <p className={paragraphClass}>
                COVID-19 killed more Americans than World War I, World War II,
                Korea, Vietnam, Iraq, and Afghanistan combined. The $900 billion
                murder budget watched it happen, fully armed and completely
                confused. The virus did not check your passport. Disease is the
                only enemy that attacks every nation simultaneously, and you are
                the only species that needs to be talked into fighting it.
              </p>
              <p className={paragraphClass}>
                Also, the Pentagon cannot account for{" "}
                <ParameterValue param={PENTAGON_UNACCOUNTED_FUNDS} /> that it
                has misplaced. 1% of US military spending is a fraction of the
                amount that already goes into a black hole every year and no one
                can locate. You are not redirecting the missile budget. You are
                redirecting the &quot;we lost it somewhere&quot; budget. The
                missiles won&apos;t notice.
              </p>
            </Objection>

            <Objection title='"1% is unrealistic."'>
              <p className={paragraphClass}>
                Immediately before the United States won World War II, US
                military spending was{" "}
                <ParameterValue
                  param={US_1939_MILITARY_SPENDING_PCT_LOWER_THAN_CURRENT}
                />{" "}
                lower than current levels. The country still built the bombs and
                airplanes that won the war. After winning, the US cut military
                spending <ParameterValue param={POST_WW2_MILITARY_CUT_PCT} />{" "}
                over two years. GM went from B-24 bombers back to Cadillacs.
                Frigidaire stopped making machine guns and went back to
                refrigerators. The economy produced the greatest boom in your
                history.
              </p>
              <p className={paragraphClass}>
                Same country, in living memory, did a redirect about 87 times
                the size of what this shirt asks for. Your grandparents handled
                an 88% cut and built the middle class. You are being asked for
                1% and acting like someone suggested disbanding the army during
                an invasion.
              </p>
            </Objection>

            <Objection title='"The military-industrial complex will never allow it."'>
              <p className={paragraphClass}>
                The CEO of Lockheed Martin has two options: (a) keep apocalypse
                #122, watch their family die of curable diseases, retire on the
                current trajectory; or (b) give up the one apocalypse they
                cannot use, watch their family live, invest in the biotech
                sector that absorbs a trillion redirected dollars per year,
                retire on a{" "}
                <ParameterValue
                  param={
                    TREATY_TRAJECTORY_GDP_VS_CURRENT_TRAJECTORY_MULTIPLIER_YEAR_15
                  }
                />
                -larger economy. They have not picked (b) yet because nobody has
                explained it in those terms. The shirt is how that gets
                explained.
              </p>
              <p className={paragraphClass}>
                The military-industrial complex does not benefit from the
                status quo. They die of the same diseases. They live in the same
                economy. Their children attend the same funerals. The costs of
                the current system are concentrated on everyone, including them.
                There is no winner. There is no rational beneficiary of the
                current arrangement. There is only a species that has not yet
                done the arithmetic. This book is the arithmetic.
              </p>
            </Objection>

            <Objection title='"What about defense industry jobs?"'>
              <p className={paragraphClass}>
                1% is a rounding error. The redirect funds clinical trials,
                which is also a lot of jobs: trial coordinators, medical
                statisticians, lab technicians, diagnostics manufacturing.
                Engineers building guidance systems can build medical imaging
                devices. Same differential equations, fewer funerals. Veterans
                particularly need clinical trial access for the things they got
                from serving (chronic pain, PTSD, traumatic brain injury); the
                redirect pays for the trials they need.
              </p>
            </Objection>

            <Objection title='"What if countries cheat?"'>
              <p className={paragraphClass}>
                Of course they will. This system was designed by someone who has
                watched 847 civilizations (me), and it does not use trust. It
                uses math. Politicians who comply receive{" "}
                <ManualLink
                  href={`${manualBase}/solution/incentive-alignment-bonds.html`}
                >
                  Incentive Alignment Bond
                </ManualLink>{" "}
                benefits: campaign funding and cushy post-office careers.
                Politicians who don&apos;t comply get nothing. Every
                disbursement is published on a public ledger keyed to specific
                trials with specific outcomes via the{" "}
                <ManualLink
                  href={`${manualBase}/solution/decentralized-accountability-office.html`}
                >
                  Decentralized Accountability Office
                </ManualLink>{" "}
                and{" "}
                <ManualLink
                  href={`${manualBase}/solution/automated-revenue-service.html`}
                >
                  Automated Revenue Service
                </ManualLink>
                . The 1% that gets siphoned off does not get siphoned off
                invisibly. Auditors see every wire; voters see every auditor.
              </p>
            </Objection>

            <Objection title='"What if other countries don&apos;t sign?"'>
              <p className={paragraphClass}>
                The first country to sign makes it easier for the second. The
                treaty follows the Ottawa (landmine) and Treaty on the
                Prohibition of Nuclear Weapons templates, both ratified by most
                countries even with the big powers holding out. Holdouts do not
                break the treaty. They make the cost of holding out visible.
                Also: TikTok scaled globally and it teaches strangers
                choreography. If your species can coordinate dance moves across
                150 countries, it can coordinate not dying.
              </p>
            </Objection>

            <Objection title='"Politicians will never agree to this."'>
              <p className={paragraphClass}>
                Politicians are also humans. They also get diseases. A
                politician who votes against the treaty is not &quot;voting
                against a budget reallocation.&quot; They are voting to keep
                apocalypse #122 (which is functionally identical to apocalypse
                #121, since you only have one civilization) in exchange for
                ensuring that their constituents, their donors, their families,
                and they themselves continue to suffer and die of preventable
                diseases while being{" "}
                <ParameterValue
                  param={
                    TREATY_TRAJECTORY_GDP_VS_CURRENT_TRAJECTORY_MULTIPLIER_YEAR_15
                  }
                />{" "}
                poorer. That is what a &quot;no&quot; vote means. The shirt
                makes sure voters understand what their representative is
                actually voting for.
              </p>
              <p className={paragraphClass}>
                Once the cascade triggers and a majority of any
                politician&apos;s constituents show up on the public treaty
                scoreboard, signing is 30 seconds of work on a budget
                spreadsheet. Refusing gets them replaced by the next candidate
                who runs on &quot;I will sign the treaty.&quot; The campaign
                also outbids the defense lobby directly: defense contractors
                spend <ParameterValue param={DEFENSE_LOBBYING_ANNUAL} /> per
                year buying politicians; the treaty{" "}
                <ManualLink
                  href={`${manualBase}/economics/campaign-budget.html`}
                >
                  lobbying budget
                </ManualLink>{" "}
                is <ParameterValue param={TREATY_CAMPAIGN_BUDGET_LOBBYING} />.
                After the treaty passes, politicians who voted yes receive{" "}
                <ManualLink
                  href={`${manualBase}/solution/incentive-alignment-bonds.html`}
                >
                  Incentive Alignment Bond
                </ManualLink>{" "}
                payouts: campaign support while running, cushy careers when
                done. Politicians who voted no receive nothing. This is
                Pavlovian conditioning, but for senators.
              </p>
            </Objection>
          </div>
        </section>

        <footer className="space-y-6 py-10">
          <p className={paragraphClass}>
            Most pranks cost the prankster something. This one earns the
            prankster VOTE points, makes the recipient a walking billboard for
            not dying, and counts each unwitting wearer toward the{" "}
            <ParameterValue param={SHIRT_SEED_WEARERS_THRESHOLD} /> social-proof
            threshold. The joke spreads itself. Do the prank.
          </p>
          <p className={paragraphClass}>
            <a
              className="underline underline-offset-4"
              href={`${manualBase}/appendix/joke.html`}
            >
              Read the philosophical footnotes (Schrödinger&apos;s joke,
              inverted Roko&apos;s Basilisk, Pascal&apos;s Wager strictly
              better) at the full essay →
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
