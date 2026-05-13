/**
 * Humanity Manager promotion — shared component rendered in BOTH the
 * dashboard's post-vote share card and the post-vote-share email.
 *
 * The caller passes a tiny `renderParam` function (and `target` prop for
 * the link/text/heading variants). The dashboard passes a renderer that
 * uses `<ParameterValue>` (with popover tooltips). The email passes one
 * that uses just `<strong>{fmtParamValueOnly(...)}</strong>` (no popover —
 * email clients can't host one).
 *
 * Why a callback instead of importing `<ParameterValue>` directly: the
 * dashboard's `<ParameterValue>` pulls in Radix Dialog + a Latex component
 * with module-top katex CSS imports. When `@react-email/components`
 * server-renders this for an email preview, that import chain trips Next.js
 * client-component boundaries and hangs the request. Keeping the shared
 * module free of dashboard-only deps is the constraint; the callback shape
 * is the minimal accommodation.
 *
 * Interactive bits (textarea, share buttons) live in the dashboard wrapper —
 * those genuinely cannot run in email regardless of approach.
 */

import { Text } from "@react-email/components";
import Link from "next/link";
import * as React from "react";
import {
  DFDA_QUEUE_CLEARANCE_YEARS,
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  fmtParamValueOnly,
  GLOBAL_POPULATION_2024,
  GLOBAL_WARHEAD_COUNT,
  NUCLEAR_WINTER_WARHEAD_THRESHOLD,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  type Parameter,
} from "@optimitron/data/parameters";
import { ROUTES } from "@/lib/routes";
import { FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR } from "@/lib/treaty-share-flow-parameters";
import { getBaseUrl } from "@/lib/url";

export type RenderTarget = "browser" | "email";

/** Renderer for a single parameter value. Browser callers wrap the value
 *  in `<ParameterValue>` for citation tooltips. Email callers use the
 *  default below (bold text only). */
export type RenderParam = (
  param: Parameter,
  figures: number,
) => React.ReactNode;

const defaultEmailRenderParam: RenderParam = (param, figures) => {
  const text = fmtParamValueOnly(param, figures);
  // Wrap in a manual-chapter link when available so curious readers can
  // click through — same affordance as the dashboard's popover.
  if (param.manualPageUrl) {
    return (
      <a
        href={param.manualPageUrl}
        style={{ color: "#111827", textDecoration: "underline" }}
      >
        <strong>{text}</strong>
      </a>
    );
  }
  return <strong>{text}</strong>;
};

/** Promote a relative path to an absolute URL for email contexts. */
function absoluteEmailUrl(href: string): string {
  if (/^https?:\/\//i.test(href)) return href;
  const base = getBaseUrl().replace(/\/+$/, "");
  return `${base}${href.startsWith("/") ? href : `/${href}`}`;
}

function PromoLink({
  target,
  href,
  children,
}: {
  target: RenderTarget;
  href: string;
  children: React.ReactNode;
}) {
  if (target === "email") {
    return (
      <a
        href={absoluteEmailUrl(href)}
        style={{ color: "#111827", textDecoration: "underline" }}
      >
        {children}
      </a>
    );
  }
  return (
    <Link
      href={href}
      className="underline decoration-dotted underline-offset-2 hover:no-underline"
    >
      {children}
    </Link>
  );
}

function PromoEyebrow({
  target,
  children,
}: {
  target: RenderTarget;
  children: React.ReactNode;
}) {
  if (target === "email") {
    return (
      <Text
        style={{
          color: "#71717a",
          fontSize: "13px",
          fontWeight: 700,
          letterSpacing: "0.14em",
          lineHeight: "1.6",
          margin: "0 0 24px",
          textTransform: "uppercase",
        }}
      >
        {children}
      </Text>
    );
  }
  return (
    <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--treaty-ink)]/60">
      {children}
    </p>
  );
}

function PromoHeading({
  target,
  children,
}: {
  target: RenderTarget;
  children: React.ReactNode;
}) {
  if (target === "email") {
    return (
      <Text
        style={{
          color: "#111827",
          fontSize: "32px",
          fontWeight: 900,
          lineHeight: "1.1",
          margin: "0 0 16px",
        }}
      >
        {children}
      </Text>
    );
  }
  return (
    <h2 className="mt-2 text-2xl font-black uppercase leading-tight tracking-tight sm:text-3xl">
      {children}
    </h2>
  );
}

function PromoText({
  target,
  children,
  muted = false,
}: {
  target: RenderTarget;
  children: React.ReactNode;
  muted?: boolean;
}) {
  if (target === "email") {
    return (
      <Text
        style={{
          color: muted ? "#71717a" : "#111827",
          fontSize: muted ? "13px" : "16px",
          fontWeight: muted ? 400 : 700,
          lineHeight: muted ? "1.6" : "1.7",
          margin: "0 0 16px",
        }}
      >
        {children}
      </Text>
    );
  }
  return (
    <p className={muted ? "text-[var(--treaty-ink)]/70" : undefined}>
      {children}
    </p>
  );
}

function PromoBody({
  target,
  children,
}: {
  target: RenderTarget;
  children: React.ReactNode;
}) {
  if (target === "email") {
    return <>{children}</>;
  }
  return (
    <div className="mt-4 space-y-3 text-sm font-bold leading-7 text-[var(--treaty-ink)] sm:text-base">
      {children}
    </div>
  );
}

export function HumanityManagerPromotion({
  target,
  renderParam,
}: {
  target: RenderTarget;
  /** Required for `target="browser"` to enable ParameterValue tooltips.
   *  Optional for `target="email"` — defaults to bold + manual-chapter link. */
  renderParam?: RenderParam;
}) {
  const rp = renderParam ?? defaultEmailRenderParam;
  return (
    <>
      <PromoEyebrow target={target}>Humanity Manager · Assignment 1</PromoEyebrow>
      <PromoHeading target={target}>
        Trade one apocalypse for {rp(DFDA_TRIAL_CAPACITY_MULTIPLIER, 3)}×
        more clinical trials.
      </PromoHeading>
      <PromoBody target={target}>
        <PromoText target={target}>
          You have been promoted to Humanity Manager at Earth Optimization
          Services LLC. Responsible for {rp(GLOBAL_POPULATION_2024, 1)}{" "}
          humans. First task: get them to ratify the{" "}
          <PromoLink target={target} href={ROUTES.treaty}>1% Treaty</PromoLink>.
        </PromoText>
        <PromoText target={target}>
          Earth owns {rp(GLOBAL_WARHEAD_COUNT, 3)} nuclear warheads.{" "}
          {rp(NUCLEAR_WINTER_WARHEAD_THRESHOLD, 3)} of them ends civilization.
          That is {rp(FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR, 3)} apocalypses on
          the shelf. Spend one apocalypse on{" "}
          {rp(DFDA_TRIAL_CAPACITY_MULTIPLIER, 3)}× more clinical trials and
          the disease-eradication timeline collapses from{" "}
          {rp(STATUS_QUO_QUEUE_CLEARANCE_YEARS, 3)} years to{" "}
          {rp(DFDA_QUEUE_CLEARANCE_YEARS, 2)}.
        </PromoText>
        <PromoText target={target} muted>
          To get there: send the message below to two humans you love. They
          send it to two. 32 rounds reaches every adult on Earth. Getting
          humans to agree on one thing is the first step to any civilizational
          upgrade. You are responsible for this step. It cannot be completed
          without you.
        </PromoText>
      </PromoBody>
    </>
  );
}
