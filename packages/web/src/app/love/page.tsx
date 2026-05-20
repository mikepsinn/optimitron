import Link from "next/link";
import { getServerSession } from "next-auth";
import {
  DFDA_QUEUE_CLEARANCE_YEARS,
  SHARING_TIME_MINUTES,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  TREATY_REDUCTION_PCT,
} from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";
import type { ReactNode } from "react";
import { PosterQrCode } from "@/app/poster/poster-client";
import { authOptions } from "@/lib/auth";
import { WAR_ON_DISEASE_CANONICAL_ORIGIN } from "@/lib/domains";
import { getRouteMetadata } from "@/lib/metadata";
import { loveLink, ROUTES } from "@/lib/routes";
import {
  FLOW_GLOBAL_WARHEAD_COUNT,
  FLOW_MAJORITY_OF_HUMANS_ON_EARTH,
  FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR,
  FLOW_NUCLEAR_WINTER_WARHEAD_THRESHOLD,
  FLOW_WASTEFUL_APOCALYPSES,
} from "@/lib/treaty-share-flow-parameters";
import { buildUserReferralUrl } from "@/lib/url";
import { LoveCopyButton, LoveShareButton } from "./love-client";

export const metadata = getRouteMetadata(loveLink);

const CAMPAIGN_ORIGIN = WAR_ON_DISEASE_CANONICAL_ORIGIN;
const parameterClassName =
  "text-inherit decoration-[#e8e4df]/40 underline-offset-2";
const accentParameterClassName =
  "text-inherit decoration-[#ff4d4d]/40 underline-offset-2";

const stats = [
  {
    number: "300M+",
    label: "active users on dating apps globally",
  },
  {
    number: "$0",
    label: "cost per impression from a dating bio",
  },
  {
    number: (
      <ParameterValue
        className={accentParameterClassName}
        param={SHARING_TIME_MINUTES}
        valueOverride="30s"
      />
    ),
    label: "to vote at warondisease.org",
  },
] as const;

function getVisibleTargetUrl(targetUrl: string) {
  return targetUrl.replace(/^https?:\/\//, "");
}

const steps = [
  {
    title: "Vote yourself",
    body: (
      <p>
        Go to warondisease.org and take{" "}
        <ParameterValue
          className={parameterClassName}
          param={SHARING_TIME_MINUTES}
          valueOverride="30 seconds"
        />{" "}
        to vote. You can&apos;t ask others to do something you haven&apos;t done.
      </p>
    ),
  },
  {
    title: "Add it to your dating profile",
    body: (
      <p>
        Use one of the templates below, or write your own. The key is: make it
        sound like you, mention warondisease.org, and keep it natural.
      </p>
    ),
  },
  {
    title: "When someone messages you, ask them to vote",
    body: (
      <p>
        A person already talking to you is 20x more likely to vote than a
        stranger reading a bio. The warm ask converts better than the cold one.
        Wait until they&apos;re engaged, then ask.
      </p>
    ),
  },
  {
    title: "Send them this page",
    body: (
      <p>
        If they&apos;re into it, send them here so they can do the same thing.
        Now you&apos;re both doing it. Now it&apos;s spreading.
      </p>
    ),
  },
  {
    title: "Go on a date. Put up flyers.",
    body: (
      <>
        <p>
          <Link className="text-[#ff4d4d] no-underline" href={ROUTES.poster}>
            Print flyers
          </Link>{" "}
          with your personal referral QR code from warondisease.org. When you go
          on a date, put them up around town together. Even if the date is
          terrible, you didn&apos;t waste your time. You were ending war and
          disease.
        </p>
        <p className="mt-4">
          Millions of bad dates happen every night globally. Hours of human time
          evaporating into awkward silences and forced conversations about
          hiking. This campaign converts that wasted time into the highest value
          activity mathematically possible. Even your worst date ends war and
          disease.
        </p>
      </>
    ),
  },
] as const;

const faqItems = [
  {
    question: "Won't this make my profile weird?",
    answer:
      'Your profile is currently competing with 10,000 people who like hiking and The Office. Yes, it will make your profile weird. That\'s the point. Weird is memorable. Memorable gets responses.',
  },
  {
    question: "Will it actually get me better matches?",
    answer:
      "Having a real mission is consistently rated as one of the most attractive traits in social psychology research. A person who cares about something beyond themselves is more attractive than a person who doesn't. This isn't a sacrifice. It's an upgrade.",
  },
  {
    question: "Won't people think I'm promoting something?",
    answer:
      'You\'re asking them to vote on a free website for 30 seconds. Not buy a coin, join a group, or sign up for anything. The bar for "promotion" is usually money. This is free and takes less time than reading your bio.',
  },
  {
    question: "Won't I get shadowbanned for sending the same message to everyone?",
    answer:
      "Yes, if you act like spam. Dating apps detect copy-paste messages and mass-liking. The penalty is quiet invisibility. Vary the wording. Space out your activity. Move slowly enough that a human could plausibly be doing it. For someone you actually want to meet, write to their profile before you mention the campaign. The algorithm rewards selectivity. Be a human, not a bot.",
  },
  {
    question: "What if nobody votes from my profile?",
    answer:
      "Then you still have a more interesting dating profile than you did before. There's no downside.",
  },
  {
    question: "Is this a real campaign?",
    answer:
      "Yes. The Institute for Accelerated Medicine is a 501(c)(3) nonprofit running the International Campaign to End War and Disease. The global referendum at warondisease.org is the coordination mechanism. This is one distribution channel among many. You're not being recruited into anything. You're being asked to put a link in your bio.",
  },
] as const;

function LoveSection({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`border-t border-[#2a2a2a] py-20 ${className}`}>
      {children}
    </section>
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-6 text-[1.6rem] font-bold leading-[1.3] text-[#e8e4df]">
      {children}
    </h2>
  );
}

function BodyParagraph({
  children,
  dim = false,
}: {
  children: ReactNode;
  dim?: boolean;
}) {
  return (
    <p
      className={`mb-5 text-base leading-[1.7] ${
        dim ? "text-[#8a8580]" : "text-[#e8e4df]"
      }`}
    >
      {children}
    </p>
  );
}

function BioTemplate({ children }: { children: ReactNode }) {
  return (
    <div className="relative my-10 border border-[#2a2a2a] bg-[#141414] p-8">
      <span className="absolute right-6 top-[-10px] bg-[#ff4d4d] px-2.5 py-0.5 font-mono text-[0.65rem] font-normal uppercase tracking-[0.15em] text-[#0a0a0a]">
        COPY THIS
      </span>
      <p className="text-[0.95rem] leading-[1.8] text-[#e8e4df]">
        {children}
      </p>
    </div>
  );
}

function Placeholder({ children }: { children: ReactNode }) {
  return <span className="italic text-[#ffd700]">{children}</span>;
}

const buttonClassName =
  "inline-flex cursor-pointer items-center justify-center border border-transparent bg-[#ff4d4d] px-12 py-4 font-mono text-[0.85rem] font-bold uppercase tracking-[0.1em] text-[#0a0a0a] no-underline transition-colors hover:bg-[#e8e4df]";

const secondaryButtonClassName =
  "inline-flex cursor-pointer items-center justify-center border border-[#8a8580] bg-transparent px-12 py-4 font-mono text-[0.85rem] font-bold uppercase tracking-[0.1em] text-[#e8e4df] no-underline transition-colors hover:border-[#e8e4df] hover:bg-[#e8e4df] hover:text-[#0a0a0a]";

const utilityButtonClassName =
  "inline-flex cursor-pointer items-center justify-center gap-2 border border-[#8a8580] bg-transparent px-5 py-3 font-mono text-[0.78rem] font-bold uppercase tracking-[0.1em] text-[#e8e4df] no-underline transition-colors hover:border-[#e8e4df] hover:bg-[#e8e4df] hover:text-[#0a0a0a]";

function CampaignUrlCard({
  hasPersonalReferralUrl,
  referralUrl,
}: {
  hasPersonalReferralUrl: boolean;
  referralUrl: string;
}) {
  const visibleReferralUrl = getVisibleTargetUrl(referralUrl);

  return (
    <div className="my-12 grid gap-6 border border-[#2a2a2a] bg-[#141414] p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
      <div className="min-w-0">
        <h3 className="mb-2 font-mono text-xs uppercase tracking-[0.15em] text-[#ff4d4d]">
          Your campaign URL
        </h3>
        <p className="mb-4 text-[0.95rem] leading-[1.7] text-[#8a8580]">
          {hasPersonalReferralUrl
            ? "Use this in your bio, messages, and flyers."
            : "This is the public campaign URL. Sign in to print a personal URL and QR code."}
        </p>
        <p className="mb-4 break-all font-mono text-[0.95rem] leading-[1.6] text-[#e8e4df]">
          {visibleReferralUrl}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <LoveCopyButton
            className={utilityButtonClassName}
            value={referralUrl}
          />
          <Link className={utilityButtonClassName} href={ROUTES.poster}>
            Print flyers
          </Link>
          {!hasPersonalReferralUrl && (
            <Link className={utilityButtonClassName} href={ROUTES.signIn}>
              Sign in
            </Link>
          )}
        </div>
      </div>
      <div className="w-fit border border-[#2a2a2a] bg-white p-3 [&_svg]:h-32 [&_svg]:w-32">
        <PosterQrCode value={referralUrl} />
      </div>
    </div>
  );
}

export default async function LovePage() {
  const session = await getServerSession(authOptions);
  const hasPersonalReferralUrl = Boolean(
    session?.user?.handle?.trim() || session?.user?.referralCode?.trim(),
  );
  const referralUrl = buildUserReferralUrl(session?.user, CAMPAIGN_ORIGIN);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#0a0a0a] text-[#e8e4df] [font-family:var(--v0-font-libre-baskerville)]">
      <div
        className="pointer-events-none fixed inset-0 z-[1000] opacity-[0.03]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
        }}
      />
      <div className="mx-auto max-w-[720px] px-6">
        <div className="relative flex min-h-screen flex-col justify-center py-20">
          <p className="mb-8 font-mono text-xs uppercase tracking-[0.2em] text-[#ff4d4d]">
            A proposal
          </p>
          <h1 className="mb-8 text-[clamp(2rem,5vw,3.2rem)] font-bold leading-[1.2] text-[#e8e4df]">
            End war and disease{" "}
            <span className="text-[#ff4d4d]">from your dating profile.</span>
          </h1>
          <p className="max-w-[540px] text-[1.15rem] italic text-[#8a8580]">
            You&apos;re already on the apps. You&apos;re already writing a bio.
            You might as well save a few billion lives while you&apos;re at it.
          </p>
          <div className="absolute bottom-0 left-1/2 h-20 w-px -translate-x-1/2 bg-gradient-to-b from-[#8a8580] to-transparent" />
        </div>

        <LoveSection>
          <SectionHeading>The situation</SectionHeading>
          <BodyParagraph>
            It requires only{" "}
            <ParameterValue
              className={parameterClassName}
              param={FLOW_NUCLEAR_WINTER_WARHEAD_THRESHOLD}
              valueOverride="100"
            />{" "}
            nuclear explosions to cause a nuclear winter, which would collapse
            the food chain and end civilization. Humanity currently has{" "}
            <ParameterValue
              className={parameterClassName}
              param={FLOW_GLOBAL_WARHEAD_COUNT}
              valueOverride="12,000"
            />{" "}
            nuclear bombs, which is sufficient for{" "}
            <ParameterValue
              className={parameterClassName}
              param={FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR}
              valueOverride="122"
            />{" "}
            apocalypses.
          </BodyParagraph>
          <BodyParagraph>
            Given that you can only destroy civilization once, it seems like
            humanity would be willing to settle for{" "}
            <ParameterValue
              className={parameterClassName}
              param={FLOW_WASTEFUL_APOCALYPSES}
              valueOverride="121"
            />{" "}
            apocalypses in exchange for potentially preventing themselves and
            everyone they love from suffering and dying of horrible diseases.
          </BodyParagraph>
          <BodyParagraph>
            If humanity redirected{" "}
            <ParameterValue
              className={parameterClassName}
              param={TREATY_REDUCTION_PCT}
              valueOverride="1%"
            />{" "}
            of military spending to clinical trials, disease eradication becomes
            plausible in{" "}
            <ParameterValue
              className={parameterClassName}
              param={DFDA_QUEUE_CLEARANCE_YEARS}
              valueOverride="36"
            />{" "}
            years instead of{" "}
            <ParameterValue
              className={parameterClassName}
              param={STATUS_QUO_QUEUE_CLEARANCE_YEARS}
              valueOverride="443"
            />{" "}
            years at the current rate.
          </BodyParagraph>
          <BodyParagraph>
            We built a website where everyone can vote on this. We need a
            majority of humanity, over{" "}
            <ParameterValue
              className={parameterClassName}
              param={FLOW_MAJORITY_OF_HUMANS_ON_EARTH}
              valueOverride="4 billion people"
            />
            , to vote. That&apos;s a distribution problem.
          </BodyParagraph>

          <div className="my-10 border-l-[3px] border-[#ff4d4d] bg-[#141414] p-8 italic">
            <BodyParagraph>
              Dating apps have hundreds of millions of active users. Each
              profile is seen by hundreds or thousands of people. If even 10,000
              supporters put warondisease.org in their bios, that&apos;s tens of
              millions of impressions from a channel that costs nothing.
            </BodyParagraph>
          </div>
        </LoveSection>

        <LoveSection>
          <SectionHeading>
            Why this works on dating apps specifically
          </SectionHeading>
          <BodyParagraph>
            Having a mission is attractive. This is well documented in social
            psychology. A person who is focused on something bigger than
            themselves is more compelling than a person whose bio says
            &quot;looking for my partner in crime.&quot;
          </BodyParagraph>
          <BodyParagraph>
            You&apos;re not choosing between a good dating profile and helping
            end war and disease. A profile with a real mission IS a better
            dating profile. The person benefits individually from participating.
          </BodyParagraph>

          <div className="my-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {stats.map((stat) => (
              <div
                className="border border-[#2a2a2a] bg-[#141414] px-4 py-8 text-center"
                key={stat.label}
              >
                <span className="mb-2 block font-mono text-3xl font-bold text-[#ff4d4d]">
                  {stat.number}
                </span>
                <span className="text-[0.8rem] leading-[1.4] text-[#8a8580]">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          <BodyParagraph>
            Every person who sees your profile and doesn&apos;t match with you
            can still vote. Every left swipe is a potential vote. Your
            rejections are saving lives.
          </BodyParagraph>
        </LoveSection>

        <LoveSection>
          <SectionHeading>The math</SectionHeading>
          <div className="my-10 border border-[#2a2a2a] bg-[#141414] p-8">
            <div className="font-mono text-[0.85rem] leading-[2] text-[#8a8580]">
              <p>Average dating profile: seen by ~500 people/month</p>
              <p>10,000 supporters with bios = 5,000,000 impressions/month</p>
              <p>
                Conservative 1% click-through to warondisease.org = 50,000
                votes/month
              </p>
              <p>At that rate, 4 billion votes in ~6,600 years</p>
              <p className="mt-6">
                But each voter tells friends. At 2x viral coefficient:
              </p>
              <p className="text-base font-bold text-[#ffd700]">
                50,000 → 100,000 → 200,000 → snowball
              </p>
              <p className="mt-6">
                The point isn&apos;t that dating apps alone get to 4 billion.
              </p>
              <p>
                The point is they&apos;re one free channel in a portfolio of
                channels,
              </p>
              <p>and you were going to be on the app anyway.</p>
            </div>
          </div>
        </LoveSection>

        <LoveSection>
          <SectionHeading>How to do it</SectionHeading>

          <div className="my-10 [counter-reset:step]">
            {steps.map((step) => (
              <div
                className="relative mb-10 pl-12 [counter-increment:step] sm:pl-16"
                key={step.title}
              >
                <span className="absolute left-0 top-0 font-mono text-[1.8rem] font-bold text-[#ff4d4d] opacity-60 before:content-[counter(step)]" />
                <h3 className="mb-2 text-[1.1rem] font-bold text-[#e8e4df]">
                  {step.title}
                </h3>
                <div className="text-[0.95rem] leading-[1.7] text-[#8a8580]">
                  {step.body}
                </div>
              </div>
            ))}
          </div>

          <CampaignUrlCard
            hasPersonalReferralUrl={hasPersonalReferralUrl}
            referralUrl={referralUrl}
          />
        </LoveSection>

        <LoveSection>
          <SectionHeading>The opening message</SectionHeading>
          <BodyParagraph>
            When you match with someone, or even when you&apos;re sending a
            first message, open with:
          </BodyParagraph>
          <div className="my-10 border border-[#2a2a2a] bg-[#141414] p-8">
            <p className="text-[1.1rem] italic leading-[1.7] text-[#e8e4df]">
              &quot;I have a great idea for how you can improve your profile. Do
              you want to hear it?&quot;
            </p>
          </div>
          <BodyParagraph>
            Everyone wants a better dating profile. Curiosity alone will get a
            response. When they say yes, send them this page. The
            &quot;improvement&quot; is adding warondisease.org to their bio.
          </BodyParagraph>
          <BodyParagraph>
            Now they&apos;re voting. Now they&apos;re adding it to their profile.
            Now they&apos;re sending the same message to their matches. Each
            person who participates creates more people who participate.
          </BodyParagraph>
          <BodyParagraph>
            You started a conversation. You might also start a relationship.
            Either way, you started a chain reaction.
          </BodyParagraph>
        </LoveSection>

        <LoveSection>
          <SectionHeading>Bio templates</SectionHeading>
          <BodyParagraph dim>
            Use these as-is or adapt to your voice. The only requirement is that
            warondisease.org appears and the reader has a reason to click it.
          </BodyParagraph>

          <BioTemplate>
            It requires only 100 nuclear explosions to end civilization.
            Humanity has enough for 122. Seems like we could spare 1% of the
            budget for curing diseases instead. I made a website where you can
            vote on it. warondisease.org. It takes 30 seconds.{" "}
            <Placeholder>
              [then write whatever you normally write about yourself]
            </Placeholder>
          </BioTemplate>

          <BioTemplate>
            Before you evaluate whether I&apos;m worth your time, please take 30
            seconds to vote at warondisease.org. It will statistically prevent
            more suffering than anything you will learn about me in the next
            four paragraphs.{" "}
            <Placeholder>[then write your normal bio]</Placeholder>
          </BioTemplate>

          <BioTemplate>
            <Placeholder>[your normal bio here]</Placeholder> Also I&apos;m
            trying to get 4 billion people to vote to redirect 1% of military
            spending to curing diseases. warondisease.org. It takes 30 seconds.
            Your left swipe can still save lives.
          </BioTemplate>

          <BioTemplate>
            My most controversial opinion is that humanity should settle for 121
            apocalypses instead of 122 and use the savings to cure diseases 12
            times faster. Vote on it at warondisease.org. Now, about me:{" "}
            <Placeholder>[your normal bio]</Placeholder>
          </BioTemplate>
        </LoveSection>

        <LoveSection>
          <SectionHeading>The deeper idea</SectionHeading>
          <BodyParagraph>
            You&apos;re on a dating app because you want to love someone and be
            loved. That&apos;s the whole reason anyone is here.
          </BodyParagraph>
          <BodyParagraph>
            What if you extended that impulse slightly? Not just to the person
            you match with but to the 8 billion people who also don&apos;t want
            to suffer and die of horrible diseases?
          </BodyParagraph>
          <BodyParagraph>
            You don&apos;t have to be in love with everyone on earth. You just
            have to care enough about strangers to spend 30 seconds voting so
            they don&apos;t die of something curable. That&apos;s a very low bar
            for love. You&apos;re already meeting it by being a person who reads
            dating profiles instead of just looking at pictures.
          </BodyParagraph>
          <BodyParagraph>
            Wars happen because people don&apos;t care enough about the people on
            the other side. Diseases go uncured because people don&apos;t care
            enough about the people who have them. The entire problem is a
            deficit of giving a shit.
          </BodyParagraph>
          <BodyParagraph>
            You give a shit. You&apos;re here. Put it in your bio.
          </BodyParagraph>
        </LoveSection>

        <LoveSection>
          <SectionHeading>Questions you might have</SectionHeading>

          {faqItems.map((item) => (
            <div className="mb-8" key={item.question}>
              <h3 className="mb-2 text-base font-bold text-[#e8e4df]">
                {item.question}
              </h3>
              <p className="text-[0.95rem] leading-[1.7] text-[#8a8580]">
                {item.answer}
              </p>
            </div>
          ))}
        </LoveSection>

        <div className="py-28 text-center">
          <h2 className="mb-4 text-3xl font-bold leading-[1.3] text-[#e8e4df]">
            Your dating profile is seen by hundreds of people. Most of them will
            swipe left. Make the left swipes count.
          </h2>
          <p className="mb-10 text-base italic text-[#8a8580]">
            Vote first. Then put it in your bio. Then send this page to someone.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link className={buttonClassName} href={ROUTES.vote}>
              Vote now
            </Link>
            <LoveShareButton className={secondaryButtonClassName} />
          </div>
        </div>

        <footer className="border-t border-[#2a2a2a] py-10 text-center text-[0.85rem] text-[#8a8580]">
          <p>
            A project of the{" "}
            <a
              className="text-[#ff4d4d] no-underline"
              href="https://warondisease.org"
            >
              Institute for Accelerated Medicine
            </a>
            . Love, Mike.
          </p>
        </footer>
      </div>
    </main>
  );
}
